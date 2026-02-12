import mongoose from "mongoose";

export interface IRedesSociaisConfig {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  whatsapp?: string;
  whatsappGrupo?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedesSociaisConfigSchema = new mongoose.Schema<IRedesSociaisConfig>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true, unique: true },
    facebook: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    twitter: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
    whatsappGrupo: { type: String, default: "", trim: true },
    youtube: { type: String, default: "", trim: true },
    tiktok: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.RedesSociaisConfig ??
  mongoose.model<IRedesSociaisConfig>("RedesSociaisConfig", RedesSociaisConfigSchema);
