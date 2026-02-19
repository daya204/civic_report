import mongoose, { Schema, type Model } from "mongoose"
import type {
  ComplaintCategory,
  ComplaintStatus,
  UserRole,
  Comment as CommentType,
} from "@/lib/types"

const commentSchema = new Schema<CommentType>(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: ["citizen", "authority"], required: true },
    content: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false }
)

const complaintSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "road",
        "garbage",
        "drainage",
        "water_supply",
        "electricity",
        "sanitation",
        "other",
      ] satisfies ComplaintCategory[],
      required: true,
    },
    status: {
      type: String,
      enum: ["unsolved", "read", "on_the_way", "in_progress", "solved", "verified"] satisfies ComplaintStatus[],
      default: "unsolved",
    },
    location: { type: String, required: true },
    region: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    images: [{ type: String }],
    proofImage: { type: String },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    likes: { type: Number, default: 0 },
    likedByCurrentUser: { type: Boolean, default: false },
    facingSameIssue: { type: Number, default: 0 },
    comments: [commentSchema],
    resolvedAt: { type: String },
    verifiedAt: { type: String },
  },
  { timestamps: true }
)

export type ComplaintDocument = mongoose.InferSchemaType<typeof complaintSchema>
export type ComplaintModel = Model<ComplaintDocument>

export const Complaint =
  (mongoose.models.Complaint as ComplaintModel) ||
  mongoose.model<ComplaintDocument>("Complaint", complaintSchema)

