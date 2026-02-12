import mongoose from "mongoose";
import type { TipoRealizacaoSorteio } from "@/lib/api";

export interface ICampanha {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  tipoSorteio: string;
  quantidadeTitulos: number;
  valorPorTitulo?: number;
  arrecadacaoEstimada: number;
  taxa: number;
  dataInicio?: string;
  dataFim?: string;
  tipoRealizacaoSorteio?: TipoRealizacaoSorteio;
  dataSorteio?: string;
  minutosPixExpirar?: number;
  mercadoPagoHabilitado?: boolean;
  mercadoPagoPublicKey?: string;
  regulamento?: string;
  prazoReservaExpirar?: number;
  quantidadeMinimaReserva?: number;
  quantidadeMaximaReserva?: number;
  modoTitulos?: "aleatorios" | "expostos";
  progressoVisivel?: boolean;
  rankingVisivel?: boolean;
  premios?: string;
  promocao?: string;
  status: "rascunho" | "ativa" | "finalizada";
  createdAt: Date;
  updatedAt: Date;
}

const CampanhaSchema = new mongoose.Schema<ICampanha>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, trim: true },
    imagemUrl: { type: String },
    tipoSorteio: { type: String, required: true },
    quantidadeTitulos: { type: Number, required: true },
    valorPorTitulo: { type: Number },
    arrecadacaoEstimada: { type: Number, required: true },
    taxa: { type: Number, required: true },
    dataInicio: { type: String },
    dataFim: { type: String },
    tipoRealizacaoSorteio: { type: String, enum: ["venda_total", "data_encerramento", "data_especifica"] },
    dataSorteio: { type: String },
    minutosPixExpirar: { type: Number },
    mercadoPagoHabilitado: { type: Boolean },
    mercadoPagoPublicKey: { type: String },
    regulamento: { type: String },
    prazoReservaExpirar: { type: Number },
    quantidadeMinimaReserva: { type: Number },
    quantidadeMaximaReserva: { type: Number },
    modoTitulos: { type: String, enum: ["aleatorios", "expostos"], default: "aleatorios" },
    progressoVisivel: { type: Boolean, default: false },
    rankingVisivel: { type: Boolean, default: false },
    premios: { type: String },
    promocao: { type: String },
    status: { type: String, enum: ["rascunho", "ativa", "finalizada"], default: "rascunho" },
  },
  { timestamps: true }
);

CampanhaSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Campanha ?? mongoose.model<ICampanha>("Campanha", CampanhaSchema);
