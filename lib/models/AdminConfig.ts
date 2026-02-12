import mongoose from "mongoose";

export interface IAdminConfig {
  _id: string;
  whatsappUrl?: string;
  registrationOpen: boolean;
  updatedAt: Date;
}

const AdminConfigSchema = new mongoose.Schema<IAdminConfig>(
  {
    whatsappUrl: { type: String, default: "" },
    registrationOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.AdminConfig ?? mongoose.model<IAdminConfig>("AdminConfig", AdminConfigSchema);
