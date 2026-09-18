import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkCredentials } from "@/lib/credentials-auth";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
    if (!email) return NextResponse.json({ locked: false });

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ locked: false });

    const user = await db.collection("users").findOne({ email });
    const retryAt = user?.lockUntil ? new Date(user.lockUntil).getTime() : 0;
    if (retryAt > Date.now()) return NextResponse.json({ locked: true, retryAt });
    return NextResponse.json({ locked: false });
  } catch {
    return NextResponse.json({ locked: false });
  }
}

export async function POST(request: Request) {
  const limiter = checkRateLimit(`login_${getClientIp(request)}`, {
    interval: 60 * 1000,
    maxRequests: 10,
  });

  if (!limiter.success) {
    return NextResponse.json(
      { success: false, error: `Muitas tentativas. Tente novamente em ${limiter.retryAfter} segundos.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ success: false, error: "INVALID_INPUT" }, { status: 400 });
    }

    const result = await checkCredentials(body.email, body.password);
    if (!result.success) return NextResponse.json(result, { status: 401 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "LOGIN_CHECK_FAILED" }, { status: 500 });
  }
}
