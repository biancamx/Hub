import { Schema, Document, models, model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  avatarUrl?: string;
  role: "master" | "admin" | "user";
  status: "pending" | "active" | "rejected";
  failedLoginAttempts: number;
  lockUntil: Date | null;
  mustChangePassword?: boolean;
  passwordResetRequested?: boolean;
  favorites: string[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    image: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["master", "admin", "user"], default: "user" },
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    mustChangePassword: { type: Boolean, default: false },
    passwordResetRequested: { type: Boolean, default: false },
    favorites: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export default models.User || model<IUser>("User", UserSchema);