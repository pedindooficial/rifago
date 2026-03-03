import mongoose from "mongoose";

export interface IBrandingConfig {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  /** Título exibido na aba/navegador (opcional) */
  siteTitle?: string;
  /** Logo principal (data URL ou URL pública) */
  logoUrl?: string;
  /** Favicon (data URL ou URL pública) */
  faviconUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandingConfigSchema = new mongoose.Schema<IBrandingConfig>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    siteTitle: { type: String, default: "", trim: true },
    logoUrl: { type: String, default: "", trim: true },
    faviconUrl: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.BrandingConfig ??
  mongoose.model<IBrandingConfig>("BrandingConfig", BrandingConfigSchema);

