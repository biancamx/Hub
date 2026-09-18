import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

export type CredentialCheck =
  | { success: true; user: { id: string; name: string; email: string; image: string | null; role: "master" | "admin" | "user"; status: string } }
  | { success: false; error: string; retryAt?: number };

export async function checkCredentials(emailInput: string, password: string): Promise<CredentialCheck> {
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return { success: false, error: "DATABASE_UNAVAILABLE" };

  const email = emailInput.trim().toLowerCase();
  const user = await db.collection("users").findOne({ email });
  if (!user || typeof user.password !== "string") return { success: false, error: "USER_NOT_FOUND" };

  const isMaster = email === "biancamoura.of@gmail.com";
  if (isMaster && (user.role !== "master" || user.status !== "active")) {
    await db.collection("users").updateOne(
      { _id: user._id } as never,
      { $set: { role: "master", status: "active" } }
    );
    user.role = "master";
    user.status = "active";
  }

  const now = new Date();
  if (user.lockUntil && new Date(user.lockUntil) > now) {
    const remainingMinutes = Math.ceil((new Date(user.lockUntil).getTime() - now.getTime()) / 60000);
    return { success: false, error: `LOCKED_${remainingMinutes}`, retryAt: new Date(user.lockUntil).getTime() };
  }

  if (user.status === "pending") return { success: false, error: "PENDING_APPROVAL" };
  if (user.status === "rejected") return { success: false, error: "ACCOUNT_REJECTED" };

  const passwordIsValid = await bcrypt.compare(password, user.password);
  if (!passwordIsValid) {
    const attempts = Number(user.failedLoginAttempts || 0) + 1;
    const penaltyMinutes = attempts >= 4 ? 5 * Math.pow(2, attempts - 4) : 0;
    const lockUntil = penaltyMinutes > 0 ? new Date(Date.now() + penaltyMinutes * 60000) : null;

    await db.collection("users").updateOne(
      { _id: user._id } as never,
      { $set: { failedLoginAttempts: attempts, lockUntil } }
    );

    return penaltyMinutes > 0
      ? { success: false, error: `LOCKED_${penaltyMinutes}`, retryAt: lockUntil?.getTime() }
      : { success: false, error: `INVALID_PASSWORD_${4 - attempts}` };
  }

  await db.collection("users").updateOne(
    { _id: user._id } as never,
    { $set: { failedLoginAttempts: 0, lockUntil: null } }
  );

  return {
    success: true,
    user: {
      id: user._id.toString(),
      name: String(user.name),
      email: String(user.email),
      image: typeof user.image === "string" ? user.image : null,
      role: user.role === "master" ? "master" : user.role === "admin" ? "admin" : "user",
      status: typeof user.status === "string" ? user.status : "active",
    },
  };
}
