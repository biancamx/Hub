import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "node:dns/promises";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createLog } from "@/lib/logger";

async function isEmailDomainValid(email: string): Promise<boolean> {
  try {
    const domain = email.split("@")[1];
    if (!domain) return false;
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const limiter = checkRateLimit(`register_${clientIp}`, {
      interval: 60 * 1000,
      maxRequests: 3,
    });

    if (!limiter.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Muitas tentativas de cadastro. Tente novamente em ${limiter.retryAfter} segundos.`,
        },
        { status: 429 }
      );
    }

    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ success: false, error: "A senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!(await isEmailDomainValid(cleanEmail))) {
      return NextResponse.json({ success: false, error: "O domínio deste e-mail é inválido ou não existe." }, { status: 400 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro de banco." }, { status: 500 });
    if (await db.collection("users").findOne({ email: cleanEmail })) {
      return NextResponse.json({ success: false, error: "Este e-mail já está cadastrado." }, { status: 400 });
    }

    await db.collection("users").insertOne({
      name: String(name).trim(),
      email: cleanEmail,
      password: await bcrypt.hash(password, 10),
      role: "user",
      status: "pending",
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
    });

    await createLog({
      level: "info",
      action: "USER_REGISTERED",
      message: `Nova solicitação de acesso registrada: ${cleanEmail}`,
      userEmail: cleanEmail,
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Cadastro realizado! Aguarde a aprovação do Administrador para acessar." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}