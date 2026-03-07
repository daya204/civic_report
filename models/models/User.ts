import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"
import type { UserRole } from "@/lib/types"

interface IUserSchema {
  name: string
  username: string
  email: string
  phone?: string
  address: string
  passwordHash: string
  role: UserRole
  avatar?: string
  region: string
}

type UserDocument = InferSchemaType<typeof userSchema>

const userSchema = new Schema<IUserSchema>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["citizen", "authority"], default: "citizen" },
    avatar: { type: String },
    region: { type: String, required: true },
  },
  { timestamps: true }
)

export type UserModel = Model<UserDocument>

export const User =
  (mongoose.models.User as UserModel) || mongoose.model<UserDocument>("User", userSchema)

