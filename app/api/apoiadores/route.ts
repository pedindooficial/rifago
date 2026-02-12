import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";

export type ApoiadorCompra = {
  campanhaId: string;
  campanhaNome: string;
  numeros: string[];
  valorTotal: number;
  quantidade: number;
  status: string;
  createdAt: string;
};

export type Apoiador = {
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  totalGasto: number;
  compras: ApoiadorCompra[];
};

/** GET: lista apoiadores (compradores) de todas as campanhas do usuário. */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const campanhas = await Campanha.find({ userId: token.id })
      .select("_id nome")
      .lean();
    const campanhaIds = campanhas.map((c) => (c as unknown as { _id: mongoose.Types.ObjectId })._id);
    const nomesPorId = Object.fromEntries(
      campanhas.map((c) => [(c as unknown as { _id: mongoose.Types.ObjectId })._id.toString(), (c as unknown as { nome: string }).nome])
    );

    if (campanhaIds.length === 0) {
      return NextResponse.json({ apoiadores: [] });
    }

    const compras = await Compra.find({
      campanhaId: { $in: campanhaIds },
      status: { $in: ["paga", "simulada"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const porComprador = new Map<
      string,
      { nome: string; cpf: string; email: string; telefone?: string; totalGasto: number; compras: ApoiadorCompra[] }
    >();

    for (const c of compras) {
      const doc = c as unknown as {
        comprador: { nome: string; cpf: string; email: string; telefone?: string };
        campanhaId: mongoose.Types.ObjectId;
        numeros: string[];
        valorTotal: number;
        quantidade: number;
        status: string;
        createdAt: Date;
      };
      const key = `${doc.comprador.cpf}-${doc.comprador.email}`;
      const campanhaId = doc.campanhaId.toString();
      const item: ApoiadorCompra = {
        campanhaId,
        campanhaNome: nomesPorId[campanhaId] ?? "Campanha",
        numeros: doc.numeros ?? [],
        valorTotal: doc.valorTotal,
        quantidade: doc.quantidade,
        status: doc.status,
        createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      };
      const existente = porComprador.get(key);
      if (existente) {
        existente.totalGasto += doc.valorTotal;
        existente.compras.push(item);
      } else {
        porComprador.set(key, {
          nome: doc.comprador.nome,
          cpf: doc.comprador.cpf,
          email: doc.comprador.email,
          telefone: doc.comprador.telefone,
          totalGasto: doc.valorTotal,
          compras: [item],
        });
      }
    }

    const apoiadores: Apoiador[] = Array.from(porComprador.values()).map((a) => ({
      ...a,
      totalGasto: Math.round(a.totalGasto * 100) / 100,
    }));

    apoiadores.sort((a, b) => b.totalGasto - a.totalGasto);

    return NextResponse.json({ apoiadores });
  } catch (error) {
    console.error("Erro ao listar apoiadores:", error);
    return NextResponse.json(
      { error: "Erro ao listar apoiadores" },
      { status: 500 }
    );
  }
}
