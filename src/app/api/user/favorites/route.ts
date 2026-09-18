import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/auth";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: true, data: [] });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false }, { status: 500 });

    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    return NextResponse.json({ success: true, data: user?.favorites || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const { cardId } = await request.json();
    if (!cardId) {
      return NextResponse.json({ success: false, error: "ID do card obrigatório" }, { status: 400 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false }, { status: 500 });

    const email = session.user.email.toLowerCase().trim();
    const user = await db.collection("users").findOne({ email });
    const currentFavorites: string[] = user?.favorites || [];
    const isAlreadyFavorite = currentFavorites.includes(String(cardId));
    const updatedFavorites = isAlreadyFavorite
      ? currentFavorites.filter((id) => id !== String(cardId))
      : [...currentFavorites, String(cardId)];

    await db.collection("users").updateOne(
      { email },
      { $set: { favorites: updatedFavorites } }
    );

    return NextResponse.json({
      success: true,
      data: updatedFavorites,
      isFavorite: !isAlreadyFavorite,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
