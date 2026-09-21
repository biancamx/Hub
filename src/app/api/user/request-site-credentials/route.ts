import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/auth";
import { createLog } from "@/lib/logger";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const { requestId, systemName } = await request.json();
    if (!requestId || !systemName) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false }, { status: 500 });

    const email = session.user.email.toLowerCase().trim();
    let targetId: any;
    try {
      targetId = new mongoose.Types.ObjectId(requestId);
    } catch {
      targetId = requestId;
    }

    const result = await db.collection("access_requests").updateOne(
      { _id: targetId, email, status: "approved" },
      { $set: { credentialsForgot: true, passwordViewed: false, updatedAt: new Date() } }
    );

    if (!result.matchedCount) {
      return NextResponse.json({ success: false, error: "Acesso não encontrado." }, { status: 404 });
    }

    await createLog({
      level: "warn",
      action: "CREDENTIALS_FORGOT_REQUEST",
      message: `O colaborador ${session.user.name || email} esqueceu o usuário/senha do sistema [${systemName}] e solicitou redefinição.`,
      userEmail: email,
    });

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada! O Administrador irá atualizar suas credenciais.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
