import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { createLog } from "@/lib/logger";

const validRoles = ["master", "admin", "user"] as const;
const validStatuses = ["pending", "active", "rejected"] as const;
const MASTER_EMAIL = "biancamoura.of@gmail.com";

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as ({ role?: string; email?: string } | undefined);
    const userEmail = (user?.email || "").toLowerCase().trim();
    const isMasterUser = userEmail === MASTER_EMAIL || user?.role === "master";
    if (!isMasterUser && user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, error: "Erro ao conectar ao banco" }, { status: 500 });
    }

    await db.collection("users").updateOne(
      { email: MASTER_EMAIL },
      { $set: { role: "master", status: "active" } }
    );
    const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as ({ role?: string; email?: string } | undefined);
    const currentUserRole = user?.role;
    const userEmail = (user?.email || "").toLowerCase().trim();
    const isMasterUser = userEmail === MASTER_EMAIL || currentUserRole === "master";
    if (!isMasterUser && currentUserRole !== "admin") {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    await connectToDatabase();
    const { userId, targetEmail, name, role, status, passwordResetRequested } = await request.json();

    if (role !== undefined && !isMasterUser) {
      return NextResponse.json(
        { success: false, error: "Apenas a Matriz pode conceder ou remover cargos de Administrador." },
        { status: 403 }
      );
    }

    if ((!userId && !targetEmail) || (role !== undefined && !validRoles.includes(role)) || (status !== undefined && !validStatuses.includes(status)) || (passwordResetRequested !== undefined && typeof passwordResetRequested !== "boolean")) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos" },
        { status: 400 }
      );
    }

    if (name === undefined && role === undefined && status === undefined && passwordResetRequested === undefined) {
      return NextResponse.json({ success: false, error: "Nenhuma alteração informada" }, { status: 400 });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, error: "Erro ao conectar ao banco" }, { status: 500 });
    }

    const update: { name?: string; role?: (typeof validRoles)[number]; status?: (typeof validStatuses)[number]; passwordResetRequested?: boolean } = {};
    if (name !== undefined) update.name = String(name).trim();
    if (role !== undefined) update.role = role;
    if (status !== undefined) update.status = status;
    if (passwordResetRequested !== undefined) update.passwordResetRequested = passwordResetRequested;

    let targetId: mongoose.Types.ObjectId | null = null;
    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) targetId = new mongoose.Types.ObjectId(String(userId));
    const targetQuery = targetId ? { _id: targetId } as never : { email: String(targetEmail).toLowerCase().trim() };
    const targetUser = await db.collection("users").findOne(targetQuery);

    if (targetUser?.email === MASTER_EMAIL && role && role !== "master") {
      return NextResponse.json({ success: false, error: "A conta Matriz não pode ser rebaixada!" }, { status: 400 });
    }

    const result = await db.collection("users").updateOne(targetQuery, { $set: update });

    if (!result || result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (status === "active") {
      await createLog({
        level: "info",
        action: "USER_APPROVED",
        message: `Usuário com ID ${userId} teve o acesso aprovado.`,
      });
    } else if (status === "rejected") {
      await createLog({
        level: "warn",
        action: "USER_SUSPENDED",
        message: `Usuário com ID ${userId} teve o acesso suspenso/bloqueado.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Usuário atualizado com sucesso!",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as ({ role?: string; email?: string } | undefined);
    const userEmail = (user?.email || "").toLowerCase().trim();
    const isMasterUser = userEmail === MASTER_EMAIL || user?.role === "master";
    if (!isMasterUser && user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false, error: "Erro ao conectar ao banco" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    const emailToDelete = searchParams.get("email");
    if (!userId && !emailToDelete) return NextResponse.json({ success: false, error: "ID ou e-mail não informado" }, { status: 400 });

    let query: { _id: mongoose.Types.ObjectId } | { email: string } | null = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query = { _id: new mongoose.Types.ObjectId(userId) };
    } else if (emailToDelete) {
      query = { email: emailToDelete.trim().toLowerCase() };
    }
    if (!query) return NextResponse.json({ success: false, error: "ID ou e-mail inválido" }, { status: 400 });
    const userToDelete = await db.collection("users").findOne(query);
    if (userToDelete?.email === MASTER_EMAIL) return NextResponse.json({ success: false, error: "A conta Matriz não pode ser excluída!" }, { status: 403 });
    const result = await db.collection("users").deleteOne(query);
    if (!result || result.deletedCount === 0) return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Usuário excluído com sucesso!" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
