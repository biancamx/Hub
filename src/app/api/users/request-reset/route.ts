import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.email !== "string" || !body.email.trim()) {
      return NextResponse.json({ success: false, error: "Informe o seu e-mail." }, { status: 400 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro de banco." }, { status: 500 });

    const email = body.email.trim().toLowerCase();
    const result = await db.collection("users").updateOne(
      { email },
      { $set: { passwordResetRequested: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "E-mail não encontrado no sistema." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Solicitação enviada ao Administrador com sucesso!" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}