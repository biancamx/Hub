import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Card from "@/models/card";
import { auth } from "@/auth";
export async function GET() {
  try {
    await connectToDatabase();
    const session = await auth();
    const userEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : null;
    const filter = userEmail
      ? {
          $or: [
            { userEmail: null },
            { userEmail: { $exists: false } },
            { userEmail: "" },
            { userEmail },
          ],
        }
      : {
          $or: [{ userEmail: null }, { userEmail: { $exists: false } }, { userEmail: "" }],
        };

    const cards = await Card.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: cards });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST: Cria um novo card
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Você precisa estar logado." }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase().trim();
    const userRole = (session.user as { role?: string }).role;
    const isAdmin = userRole === "admin" || userRole === "master";
    await connectToDatabase();
    const body = await request.json();

    const { title, description, url, imageUrl, isPersonal } = body;

    if (typeof title !== "string" || typeof url !== "string" || typeof imageUrl !== "string" || !title.trim() || !url.trim() || !imageUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "Título, URL e Imagem são obrigatórios." },
        { status: 400 }
      );
    }

    const newCard = await Card.create({
      title,
      description: description || "",
      url,
      imageUrl,
      userEmail: isPersonal || !isAdmin ? userEmail : null,
    });

    return NextResponse.json({ success: true, data: newCard }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}