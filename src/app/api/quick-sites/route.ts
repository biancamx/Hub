import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/auth";
import QuickSite from "@/models/QuickSite";

const isAdminRole = (role?: string) => role === "admin" || role === "master";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await auth();
    const isAdmin = isAdminRole((session?.user as any)?.role);
    const userEmail = (session?.user?.email || "").toLowerCase().trim();
    const filter = isAdmin ? {} : { active: true, $or: [{ visibilityType: "all" }, { visibilityType: "restricted", allowedUsers: userEmail }] };
    let sites = await QuickSite.find(filter).sort({ createdAt: 1 });

    if (sites.length === 0 && isAdmin) {
      sites = await QuickSite.insertMany([
        { title: "Desenhos", url: "https://exemplo.com/desenhos", active: true, visibilityType: "all", allowedUsers: [] },
        { title: "Manuais", url: "https://exemplo.com/manuais", active: true, visibilityType: "all", allowedUsers: [] },
        { title: "Projetos", url: "https://exemplo.com/projetos", active: true, visibilityType: "all", allowedUsers: [] },
        { title: "Padrões", url: "https://exemplo.com/padroes", active: true, visibilityType: "all", allowedUsers: [] },
        { title: "Normas", url: "https://exemplo.com/normas", active: true, visibilityType: "all", allowedUsers: [] },
        { title: "Portais", url: "https://exemplo.com/portais", active: true, visibilityType: "all", allowedUsers: [] },
      ]);
    }

    return NextResponse.json({ success: true, data: sites });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!isAdminRole((session?.user as any)?.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    const { title, url, category, visibilityType, allowedUsers } = await request.json();
    if (!title || !url) {
      return NextResponse.json({ success: false, error: "Título e Link são obrigatórios." }, { status: 400 });
    }

    await connectToDatabase();
    const newSite = await QuickSite.create({ title, url, category: category || "Geral", active: true, visibilityType: visibilityType || "all", allowedUsers: Array.isArray(allowedUsers) ? allowedUsers.map((email: string) => email.toLowerCase().trim()) : [] });
    return NextResponse.json({ success: true, data: newSite }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!isAdminRole((session?.user as any)?.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    const { id, title, url, active, visibilityType, allowedUsers } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "ID obrigatório." }, { status: 400 });

    await connectToDatabase();
    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (url !== undefined) update.url = url;
    if (active !== undefined) update.active = active;
    if (visibilityType !== undefined) update.visibilityType = visibilityType;
    if (allowedUsers !== undefined) update.allowedUsers = Array.isArray(allowedUsers) ? allowedUsers.map((email: string) => email.toLowerCase().trim()) : [];

    const updated = await QuickSite.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!updated) return NextResponse.json({ success: false, error: "Atalho não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!isAdminRole((session?.user as any)?.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID obrigatório." }, { status: 400 });

    await connectToDatabase();
    const deleted = await QuickSite.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, error: "Atalho não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Site excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
