import { Document, Schema, model, models } from "mongoose";

export interface IPersonalLink extends Document {
  userEmail: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  isPersonal: boolean;
  createdAt: Date;
}

const fallbackImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200";

const PersonalLinkSchema = new Schema<IPersonalLink>(
  {
    userEmail: { type: String, required: true, index: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, default: "Ferramenta pessoal personalizada", maxlength: 300 },
    url: { type: String, required: true },
    imageUrl: { type: String, default: fallbackImage, maxlength: 3 * 1024 * 1024 },
    isPersonal: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.PersonalLink || model<IPersonalLink>("PersonalLink", PersonalLinkSchema);
