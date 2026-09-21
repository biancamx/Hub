import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IQuickSite extends Document {
  title: string;
  url: string;
  category?: string;
  active: boolean;
  visibilityType: "all" | "restricted";
  allowedUsers: string[];
  createdAt: Date;
}

const QuickSiteSchema = new Schema<IQuickSite>(
  {
    title: { type: String, required: [true, "O título é obrigatório"] },
    url: { type: String, required: [true, "A URL é obrigatória"] },
    category: { type: String, default: "Geral" },
    active: { type: Boolean, default: true },
    visibilityType: { type: String, enum: ["all", "restricted"], default: "all" },
    allowedUsers: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default models.QuickSite || model<IQuickSite>("QuickSite", QuickSiteSchema);
