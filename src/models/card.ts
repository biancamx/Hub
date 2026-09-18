import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ICard extends Document {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  createdAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    title: { type: String, required: [true, "O título é obrigatório"] },
    description: { type: String, default: "" },
    url: { type: String, required: [true, "A URL de destino é obrigatória"] },
    imageUrl: { type: String, required: [true, "A URL da imagem é obrigatória"] },
  },
  {
    timestamps: true,
  }
);

export default models.Card || model<ICard>("Card", CardSchema);