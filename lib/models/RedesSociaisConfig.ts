import mongoose from "mongoose";

const REDES_KEYS = ["facebook", "instagram", "twitter", "whatsapp", "whatsappGrupo", "youtube", "tiktok", "linkedin"] as const;

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
  /** Exibir ícone na página da rifa (default true se não existir) */
  facebookAtivo?: boolean;
  instagramAtivo?: boolean;
  twitterAtivo?: boolean;
  whatsappAtivo?: boolean;
  whatsappGrupoAtivo?: boolean;
  youtubeAtivo?: boolean;
  tiktokAtivo?: boolean;
  linkedinAtivo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schemaDef: Record<string, unknown> = {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true, unique: true },
  facebook: { type: String, default: "", trim: true },
  instagram: { type: String, default: "", trim: true },
  twitter: { type: String, default: "", trim: true },
  whatsapp: { type: String, default: "", trim: true },
  whatsappGrupo: { type: String, default: "", trim: true },
  youtube: { type: String, default: "", trim: true },
  tiktok: { type: String, default: "", trim: true },
  linkedin: { type: String, default: "", trim: true },
};
REDES_KEYS.forEach((k) => {
  schemaDef[`${k}Ativo`] = { type: Boolean, default: true };
});

const RedesSociaisConfigSchema = new mongoose.Schema<IRedesSociaisConfig>(schemaDef, { timestamps: true });

export default mongoose.models.RedesSociaisConfig ??
  mongoose.model<IRedesSociaisConfig>("RedesSociaisConfig", RedesSociaisConfigSchema);
