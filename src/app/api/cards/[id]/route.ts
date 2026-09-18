import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Card from "@/models/card";
import { auth } from "@/auth";

// DELETE: Remove um card pelo ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user as ({ role?: string } | undefined);
    if (user?.role !== "admin" && user?.role !== "master") {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const deletedCard = await Card.findByIdAndDelete(id);

    if (!deletedCard) {
      return NextResponse.json(
        { success: false, error: "Card não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Card excluído com sucesso" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PUT: Atualiza um card existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user as ({ role?: string } | undefined);
    if (user?.role !== "admin" && user?.role !== "master") {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const allowedFields = ["title", "description", "url", "imageUrl"];
    const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowedFields.includes(key)));

    const updatedCard = await Card.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updatedCard) {
      return NextResponse.json(
        { success: false, error: "Card não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedCard });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}