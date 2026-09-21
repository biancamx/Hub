import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/auth";
import { createLog } from "@/lib/logger";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, subsetor, systemInterest, priority, message } = body;

    if (!name || !email || !systemInterest || !message) {
      return NextResponse.json(
        { success: false, error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro de banco" }, { status: 500 });

    const requestDoc = {
      name,
      email: String(email).toLowerCase().trim(),
      subsetor: subsetor || "Não informado",
      systemInterest,
      priority: priority || "Baixa",
      message,
      status: "pending",
      createdAt: new Date(),
    };

    await db.collection("access_requests").insertOne(requestDoc);

    await createLog({
      level: "warn",
      action: "ACCESS_REQUEST",
      message: `Nova solicitação de acesso para [${systemInterest}] enviada por ${name} (${requestDoc.email}).`,
      userEmail: requestDoc.email,
      details: requestDoc,
    });

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
