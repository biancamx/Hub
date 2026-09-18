import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Card from "@/models/card";
import { auth } from "@/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    await connectToDatabase();
    const cards = await Card.find({}).sort({ createdAt: -1 });
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
    const limiter = checkRateLimit(`cards_${getClientIp(request)}`, {
      interval: 60 * 1000,
      maxRequests: 10,
    });

    if (!limiter.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Muitas alterações enviadas em pouco tempo. Aguarde ${limiter.retryAfter} segundos.`,
        },
        { status: 429 }
      );
    }

    const session = await auth();
    const user = session?.user as ({ role?: string } | undefined);
    if (user?.role !== "admin" && user?.role !== "master") {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();

    const { title, description, url, imageUrl } = body;

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