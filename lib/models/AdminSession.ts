import mongoose from "mongoose";

const ADMIN_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export interface IAdminSession {
  token: string;
  adminId: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const AdminSessionSchema = new mongoose.Schema<IAdminSession>(
  {
    token: { type: String, required: true, unique: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + ADMIN_SESSION_MAX_AGE_MS) },
  },
  { timestamps: true }
);

AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AdminSession ?? mongoose.model<IAdminSession>("AdminSession", AdminSessionSchema);
