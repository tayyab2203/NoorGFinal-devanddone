import mongoose, { Schema, model, models } from "mongoose";
import { USER_ROLE } from "@/lib/constants";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  image: string | null;
  role: (typeof USER_ROLE)[keyof typeof USER_ROLE];
  /** Hashed password for admin login (Credentials); null for customer (Google). */
  passwordHash: string | null;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: null },
    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.CUSTOMER,
    },
    passwordHash: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    const out = ret as unknown as Record<string, unknown> & { _id?: { toString: () => string } };
    out.id = out._id?.toString?.();
    delete out._id;
    delete out.__v;
    return out;
  },
});

export const User = models.User ?? model<IUser>("User", UserSchema);
