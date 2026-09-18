import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Você precisa estar logado." }, { status: 401 });

    const { currentPassword, newPassword, confirmPassword } = await request.json();
    if (!currentPassword || !newPassword || !confirmPassword) return NextResponse.json({ success: false, error: "Preencha todos os campos." }, { status: 400 });
    if (newPassword !== confirmPassword) return NextResponse.json({ success: false, error: "A nova senha e a confirmação não conferem." }, { status: 400 });
    if (typeof newPassword !== "string" || newPassword.length < 6) return NextResponse.json({ success: false, error: "A nova senha deve ter no mínimo 6 caracteres." }, { status: 400 });

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro de banco." }, { status: 500 });
    const user = await db.collection("users").findOne({ email: session.user.email.toLowerCase() });
    if (!user || typeof user.password !== "string") return NextResponse.json({ success: false, error: "Usuário não possui senha configurada." }, { status: 400 });
    if (!(await bcrypt.compare(String(currentPassword), user.password))) return NextResponse.json({ success: false, error: "A senha atual está incorreta." }, { status: 400 });

    await db.collection("users").updateOne({ _id: user._id } as never, { $set: { password: await bcrypt.hash(newPassword, 10), mustChangePassword: false, failedLoginAttempts: 0, lockUntil: null } });
    return NextResponse.json({ success: true, message: "Sua senha foi alterada com sucesso!" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}