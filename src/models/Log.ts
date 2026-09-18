import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ILog extends Document {
  level: "info" | "warn" | "error";
  action: string;      // Ex: "USER_APPROVED", "LOGIN_FAILED", "CARD_CREATED", "SERVER_ERROR"
  message: string;     // Descrição detalhada do que houve
  userEmail?: string;  // Quem executou ou sofreu a ação (se aplicável)
  ip?: string;         // IP do cliente
  details?: any;       // Detalhes extras em formato JSON/objeto
  createdAt: Date;
}

const LogSchema = new Schema<ILog>(
  {
    level: {
      type: String,
      enum: ["info", "warn", "error"],
      default: "info",
    },
    action: { type: String, required: true },
    message: { type: String, required: true },
    userEmail: { type: String, default: null },
    ip: { type: String, default: null },
    details: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Guarda data e hora exatas
  }
);

// Índice para busca rápida ordenada por data decrescente
LogSchema.index({ createdAt: -1 });

export default models.Log || model<ILog>("Log", LogSchema);