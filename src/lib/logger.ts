import { connectToDatabase } from "@/lib/mongodb";
import Log from "@/models/Log";

interface LogParams {
  level?: "info" | "warn" | "error";
  action: string;
  message: string;
  userEmail?: string;
  ip?: string;
  details?: any;
}

export async function createLog({
  level = "info",
  action,
  message,
  userEmail,
  ip,
  details,
}: LogParams) {
  try {
    // Também printa no terminal de forma organizada
    const tag = `[${level.toUpperCase()}] [${action}]`;
    if (level === "error") {
      console.error(tag, message, details || "");
    } else if (level === "warn") {
      console.warn(tag, message);
    } else {
      console.log(tag, message);
    }

    // Salva no banco de dados na nuvem para auditoria
    await connectToDatabase();
    await Log.create({
      level,
      action,
      message,
      userEmail: userEmail || null,
      ip: ip || null,
      details: details ? (details instanceof Error ? { message: details.message, stack: details.stack } : details) : null,
    });
  } catch (err) {
    console.error("Falha ao gravar log no MongoDB:", err);
  }
}