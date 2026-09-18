import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user as { role?: string } | undefined;
    if (currentUser?.role !== "admin" && currentUser?.role !== "master") {
      return NextResponse.json({ success: false, error: "Apenas administradores podem resetar senhas." }, { status: 403 });
    }

    const { userId, userEmail, defaultPassword } = await request.json();
    if ((!userId && !userEmail) || typeof defaultPassword !== "string" || defaultPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Usuário e senha padrão de no mínimo 6 caracteres são obrigatórios." }, { status: 400 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro de banco." }, { status: 500 });

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const update = { password: hashedPassword, failedLoginAttempts: 0, lockUntil: null, passwordResetRequested: false, mustChangePassword: true };
    let result;
    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      result = await db.collection("users").updateOne({ _id: new mongoose.Types.ObjectId(String(userId)) } as never, { $set: update });
    }
    if ((!result || result.matchedCount === 0) && userEmail) {
      result = await db.collection("users").updateOne({ email: String(userEmail).trim().toLowerCase() }, { $set: update });
    }
    if (!result || result.matchedCount === 0) return NextResponse.json({ success: false, error: "Usuário não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Senha temporária definida com sucesso." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}