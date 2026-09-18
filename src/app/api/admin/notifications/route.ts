import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as { role?: string } | undefined;
    if (user?.role !== "admin" && user?.role !== "master") {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 403 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro de banco" }, { status: 500 });

    const [resetUsers, pendingUsers] = await Promise.all([
      db.collection("users").find({ passwordResetRequested: true }).project({ _id: 1, name: 1, email: 1, image: 1, avatarUrl: 1, updatedAt: 1 }).toArray(),
      db.collection("users").find({ status: "pending" }).project({ _id: 1, name: 1, email: 1, image: 1, avatarUrl: 1, createdAt: 1 }).toArray(),
    ]);

    return NextResponse.json({ success: true, data: { total: resetUsers.length + pendingUsers.length, resetUsers, pendingUsers } });
  } catch {
    return NextResponse.json({ success: false, error: "Erro ao buscar notificações" }, { status: 500 });
  }
}
