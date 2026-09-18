import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/auth";
import Log from "@/models/Log";

export async function GET(request: Request) {
  try {
    // Apenas a conta Matriz pode auditar logs
    const session = await auth();
    if (!session || !session.user || (session.user as any).role !== "master") {
      return NextResponse.json({ success: false, error: "Acesso negado. Apenas a conta Matriz tem acesso à auditoria." }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");

    const query: any = {};
    if (level && ["info", "warn", "error"].includes(level)) {
      query.level = level;
    }

    // Busca os últimos 100 eventos ordenados do mais novo para o mais velho
    const logs = await Log.find(query).sort({ createdAt: -1 }).limit(100).lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}