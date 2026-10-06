import { Document, Schema, model, models } from "mongoose";

export interface IPersonalLink extends Document {
  userEmail: string;
  title: string;
  url: string;
  createdAt: Date;
}

const PersonalLinkSchema = new Schema<IPersonalLink>(
  {
    userEmail: { type: String, required: true, index: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.PersonalLink || model<IPersonalLink>("PersonalLink", PersonalLinkSchema);
