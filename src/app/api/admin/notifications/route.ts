import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/auth";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 403 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false }, { status: 500 });

    // 1. Pedidos de reset de senha
    const resetRequests = await db.collection("users").countDocuments({ 
      passwordResetRequested: true 
    });

    // 2. Usuários aguardando aprovação de cadastro
    const pendingUsers = await db.collection("users").countDocuments({ 
      status: "pending" 
    });

    // 3. 🚀 NOVO: Solicitações de acesso a sites pendentes
    const pendingAccessRequests = await db.collection("access_requests").countDocuments({ 
      status: "pending" 
    });

    const total = resetRequests + pendingUsers + pendingAccessRequests;

    return NextResponse.json({
      success: true,
      data: {
        total,
        resetRequests,
        pendingUsers,
        pendingAccessRequests,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
