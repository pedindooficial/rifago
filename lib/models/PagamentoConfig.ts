import mongoose from "mongoose";

type ModoMP = "producao" | "teste";
type TiposPagamento = "pix_e_cartao" | "somente_pix" | "somente_cartao";

export interface IPagamentoConfig {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  mpModo: ModoMP;
  /** @deprecated use mpPublicKeyTeste/mpPublicKeyProducao */
  mpPublicKey?: string;
  /** @deprecated use mpAccessTokenTeste/mpAccessTokenProducao */
  mpAccessToken?: string;
  mpPublicKeyTeste: string;
  mpAccessTokenTeste: string;
  mpPublicKeyProducao: string;
  mpAccessTokenProducao: string;
  tiposPagamento: TiposPagamento;
  createdAt: Date;
  updatedAt: Date;
}

const PagamentoConfigSchema = new mongoose.Schema<IPagamentoConfig>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true, unique: true },
    mpModo: { type: String, enum: ["producao", "teste"], default: "teste" },
    mpPublicKey: { type: String, default: "" },
    mpAccessToken: { type: String, default: "" },
    mpPublicKeyTeste: { type: String, default: "" },
    mpAccessTokenTeste: { type: String, default: "" },
    mpPublicKeyProducao: { type: String, default: "" },
    mpAccessTokenProducao: { type: String, default: "" },
    tiposPagamento: {
      type: String,
      enum: ["pix_e_cartao", "somente_pix", "somente_cartao"],
      default: "pix_e_cartao",
    },
  },
  { timestamps: true }
);

export default mongoose.models.PagamentoConfig ??
  mongoose.model<IPagamentoConfig>("PagamentoConfig", PagamentoConfigSchema);

