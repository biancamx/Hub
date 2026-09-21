import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/auth";
import { decryptPassword } from "@/lib/encryption";
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

    const email = session.user.email.toLowerCase().trim();
    const approvedSites = await db.collection("access_requests")
      .find({ email, status: "approved" })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: approvedSites });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ success: false, error: "Solicitação inválida" }, { status: 400 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ success: false }, { status: 500 });

    let targetId: any;
    try {
      targetId = new mongoose.Types.ObjectId(requestId);
    } catch {
      targetId = requestId;
    }

    const email = session.user.email.toLowerCase().trim();
    const requestDocument = await db.collection("access_requests").findOne({ _id: targetId });
    if (!requestDocument || requestDocument.email !== email) {
      return NextResponse.json({ success: false, error: "Acesso não encontrado." }, { status: 404 });
    }

    if (requestDocument.status !== "approved") {
      return NextResponse.json({ success: false, error: "Acesso não aprovado." }, { status: 400 });
    }

    if (requestDocument.passwordViewed) {
      return NextResponse.json({
        success: false,
        error: "Esta senha já foi revelada anteriormente por segurança.",
      }, { status: 400 });
    }

    if (!requestDocument.encryptedPassword || !requestDocument.siteUrl) {
      return NextResponse.json({ success: false, error: "Credenciais de acesso indisponíveis." }, { status: 400 });
    }

    const plainPassword = decryptPassword(requestDocument.encryptedPassword);
    await db.collection("access_requests").updateOne(
      { _id: targetId },
      { $set: { passwordViewed: true } }
    );

    return NextResponse.json({
      success: true,
      password: plainPassword,
      siteUser: requestDocument.siteUser,
      siteUrl: requestDocument.siteUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
