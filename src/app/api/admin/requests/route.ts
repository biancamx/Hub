import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/auth";
import { createLog } from "@/lib/logger";
import { encryptPassword } from "@/lib/encryption";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro de banco" }, { status: 500 });

    const requests = await db.collection("access_requests").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, empresa, setor, systemInterest, priority, message } = body;

    if (!name || !email || !systemInterest || !message) {
      return NextResponse.json(
        { success: false, error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro de banco" }, { status: 500 });

    const newRequest = {
      name,
      email: String(email).toLowerCase().trim(),
      empresa: empresa || "Não informada",
      setor: setor || "Não informado",
      systemInterest,
      priority: priority || "Baixa",
      message,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await db.collection("access_requests").insertOne(newRequest);

    await createLog({
      level: "warn",
      action: "ACCESS_REQUEST_CREATED",
      message: `Novo pedido de acesso ao sistema [${systemInterest}] enviado por ${name} (${email}).`,
      userEmail: email,
      details: newRequest,
    });

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso!",
      id: result.insertedId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    const { requestId, status, siteUrl, siteUser, sitePassword } = await request.json();
    if (!requestId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro de banco" }, { status: 500 });

    let targetId: any;
    try {
      targetId = new mongoose.Types.ObjectId(requestId);
    } catch {
      targetId = requestId;
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "approved") {
      if (!siteUrl || !sitePassword || !siteUser) {
        return NextResponse.json(
          { success: false, error: "Informe o Link, o Usuário e a Senha para liberar o acesso." },
          { status: 400 }
        );
      }
      updateData.siteUrl = siteUrl;
      updateData.siteUser = siteUser;
      updateData.encryptedPassword = encryptPassword(sitePassword);
      updateData.passwordViewed = false;
    }

    await db.collection("access_requests").updateOne({ _id: targetId }, { $set: updateData });

    await createLog({
      level: "info",
      action: `ACCESS_REQUEST_${status.toUpperCase()}`,
      message: `O pedido de acesso #${requestId} foi ${status === "approved" ? "APROVADO com credenciais" : "RECUSADO"}.`,
      userEmail: session?.user?.email || undefined,
    });

    return NextResponse.json({ success: true, message: `Solicitação ${status === "approved" ? "aprovada com sucesso" : "recusada"}!` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
