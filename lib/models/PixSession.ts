import mongoose from "mongoose";

export interface IPixSession {
  _id: mongoose.Types.ObjectId;
  pagamentoId: string;
  qrCode: string;
  qrCodeBase64: string | null;
  ticketUrl?: string;
  modo: "producao" | "teste";
  campanhaId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  campanhaNome: string;
  minutosPixExpirar: number;
  nome: string;
  email: string;
  cpfMascarado: string;
  quantidade: number;
  valorTotal: number;
  createdAt: Date;
}

const PixSessionSchema = new mongoose.Schema<IPixSession>(
  {
    pagamentoId: { type: String, required: true, index: true },
    qrCode: { type: String, required: true },
    qrCodeBase64: { type: String },
    ticketUrl: { type: String },
    modo: { type: String, enum: ["producao", "teste"], required: true },
    campanhaId: { type: mongoose.Schema.Types.ObjectId, ref: "Campanha", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    campanhaNome: { type: String, required: true },
    minutosPixExpirar: { type: Number, required: true },
    nome: { type: String, required: true },
    email: { type: String, required: true },
    cpfMascarado: { type: String, required: true },
    quantidade: { type: Number, required: true },
    valorTotal: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

PixSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

export default mongoose.models.PixSession ?? mongoose.model<IPixSession>("PixSession", PixSessionSchema);
