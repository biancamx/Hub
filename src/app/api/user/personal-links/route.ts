import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import PersonalLink from "@/models/PersonalLink";
import mongoose from "mongoose";

const fallbackImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200";
const maxImageLength = 3 * 1024 * 1024;

function getAuthenticatedEmail(email: string | null | undefined) {
  return email?.toLowerCase().trim() || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro interno do servidor.";
}

export async function GET() {
  try {
    const session = await auth();
    const email = getAuthenticatedEmail(session?.user?.email);
    if (!email) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    await connectToDatabase();
    const links = await PersonalLink.find({ userEmail: email }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: links });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const email = getAuthenticatedEmail(session?.user?.email);
    if (!email) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Corpo da solicitação inválido." }, { status: 400 });
    }

    const title = isRecord(body) && typeof body.title === "string" ? body.title.trim() : "";
    const url = isRecord(body) && typeof body.url === "string" ? body.url.trim() : "";
    const description =
      isRecord(body) && typeof body.description === "string"
        ? body.description.trim()
        : "";
    const imageUrl =
      isRecord(body) && typeof body.imageUrl === "string"
        ? body.imageUrl.trim()
        : "";
    if (!title || !url) {
      return NextResponse.json({ success: false, error: "Título e link são obrigatórios." }, { status: 400 });
    }
    if (title.length > 100 || url.length > 2048 || description.length > 300) {
      return NextResponse.json({ success: false, error: "Título ou link excede o limite permitido." }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Informe uma URL válida." }, { status: 400 });
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ success: false, error: "A URL deve usar HTTP ou HTTPS." }, { status: 400 });
    }

    let validatedImageUrl = fallbackImage;
    if (imageUrl) {
      if (imageUrl.length > maxImageLength) {
        return NextResponse.json({ success: false, error: "A imagem deve ter até 2 MB." }, { status: 400 });
      }
      if (/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z\d+/]+=*$/i.test(imageUrl)) {
        validatedImageUrl = imageUrl;
      } else {
        let parsedImageUrl: URL;
        try {
          parsedImageUrl = new URL(imageUrl);
        } catch {
          return NextResponse.json({ success: false, error: "Informe uma imagem válida." }, { status: 400 });
        }
        if (parsedImageUrl.protocol !== "https:") {
          return NextResponse.json({ success: false, error: "A imagem deve usar HTTPS." }, { status: 400 });
        }
        validatedImageUrl = parsedImageUrl.toString();
      }
    }

    await connectToDatabase();
    const newLink = await PersonalLink.create({
      userEmail: email,
      title,
      description: description || "Ferramenta pessoal personalizada",
      url: parsedUrl.toString(),
      imageUrl: validatedImageUrl,
    });

    return NextResponse.json({ success: true, data: newLink }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const email = getAuthenticatedEmail(session?.user?.email);
    if (!email) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID obrigatório" }, { status: 400 });
    }
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "ID inválido." }, { status: 400 });
    }

    await connectToDatabase();
    const deletedLink = await PersonalLink.findOneAndDelete({ _id: id, userEmail: email });
    if (!deletedLink) {
      return NextResponse.json({ success: false, error: "Link não encontrado ou não autorizado." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
