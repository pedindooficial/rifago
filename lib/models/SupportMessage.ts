import mongoose from "mongoose";

export interface ISupportMessage {
  userId: mongoose.Types.ObjectId;
  sender: "user" | "admin";
  content: string;
  createdAt: Date;
}

const SupportMessageSchema = new mongoose.Schema<ISupportMessage>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: String, enum: ["user", "admin"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

SupportMessageSchema.index({ userId: 1, createdAt: 1 });

export default mongoose.models.SupportMessage ?? mongoose.model<ISupportMessage>("SupportMessage", SupportMessageSchema);
