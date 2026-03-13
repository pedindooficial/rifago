import mongoose from "mongoose";

export type StatusCompra = "pendente" | "paga" | "simulada" | "cancelada";

/**
 * Regras de negócio para status e cotas:
 *
 * - titulosVendidos (contagem na campanha): só compras "paga" e "simulada".
 * - Cotas ocupadas (não podem ser vendidas de novo): "paga", "simulada" e "pendente".
 *   Compra "cancelada" libera as cotas (os números voltam a ficar disponíveis).
 * - Sorteio (ganhador): só considera "paga" e "simulada".
 * - Números são normalizados sem zero à esquerda ao comparar (ex.: "02889" === "2889").
 */

export interface ICompra {
  _id: mongoose.Types.ObjectId;
  campanhaId: mongoose.Types.ObjectId;
  comprador: {
    nome: string;
    cpf: string; // só dígitos (11)
    email: string;
    telefone?: string;
  };
  quantidade: number;
  numeros: string[]; // números atribuídos (ex: ["0001", "0042", "0999"])
  valorTotal: number;
  status: StatusCompra;
  pagamentoId?: string; // ID do Mercado Pago quando pagamento real
  createdAt: Date;
  updatedAt: Date;
}

const CompraSchema = new mongoose.Schema<ICompra>(
  {
    campanhaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campanha",
      required: true,
      index: true,
    },
    comprador: {
      nome: { type: String, required: true, trim: true },
      cpf: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      telefone: { type: String, trim: true },
    },
    quantidade: { type: Number, required: true, min: 1 },
    numeros: [{ type: String, trim: true }],
    valorTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pendente", "paga", "simulada", "cancelada"],
      default: "pendente",
      index: true,
    },
    pagamentoId: { type: String, trim: true },
  },
  { timestamps: true }
);

CompraSchema.index({ campanhaId: 1, status: 1 });
CompraSchema.index({ "comprador.cpf": 1, "comprador.email": 1 });

export default mongoose.models.Compra ?? mongoose.model<ICompra>("Compra", CompraSchema);
