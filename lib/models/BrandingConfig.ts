import mongoose from "mongoose";

export interface IBrandingConfig {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  /** Nome da marca (usado na aba: "Marca | Nome da campanha") */
  siteTitle?: string;
  logoUrl?: string;
  faviconUrl?: string;
  /** Cor primária (hex, ex: #DC2626) para botões e destaques */
  primaryColor?: string;
  /** Texto do botão principal (ex.: Participar, Comprar cotas) */
  ctaButtonText?: string;
  /** Slogan ou frase de destaque abaixo do nome da campanha */
  slogan?: string;
  /** Texto exibido no rodapé da página da rifa */
  footerText?: string;
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
    primaryColor: { type: String, default: "", trim: true },
    ctaButtonText: { type: String, default: "", trim: true },
    slogan: { type: String, default: "", trim: true },
    footerText: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.BrandingConfig ??
  mongoose.model<IBrandingConfig>("BrandingConfig", BrandingConfigSchema);

