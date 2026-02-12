import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";

/** GET: ranking público — apenas se campanha ativa e rankingVisivel === true. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campanhaId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(campanhaId)) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    await connectDB();

    const campanha = await Campanha.findOne({
      _id: campanhaId,
      status: "ativa",
    }).lean();

    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada ou não está ativa" }, { status: 404 });
    }

    const doc = campanha as unknown as { rankingVisivel?: boolean };
    if (!doc.rankingVisivel) {
      return NextResponse.json({ ranking: [] }, { status: 200 });
    }

    const compras = await Compra.find({
      campanhaId: new mongoose.Types.ObjectId(campanhaId),
      status: { $in: ["paga", "simulada"] },
    }).lean();

    const porComprador = new Map<
      string,
      { nome: string; email: string; cpf: string; valorTotal: number; quantidadeNumeros: number }
    >();

    for (const c of compras) {
      const comp = c as unknown as {
        comprador: { nome: string; email: string; cpf: string };
        valorTotal: number;
        numeros: string[];
      };
      const key = `${comp.comprador.cpf}-${comp.comprador.email}`;
      const atual = porComprador.get(key);
      if (atual) {
        atual.valorTotal += comp.valorTotal;
        atual.quantidadeNumeros += comp.numeros?.length ?? 0;
      } else {
        porComprador.set(key, {
          nome: comp.comprador.nome,
          email: comp.comprador.email,
          cpf: comp.comprador.cpf,
          valorTotal: comp.valorTotal,
          quantidadeNumeros: comp.numeros?.length ?? 0,
        });
      }
    }

    const ranking = Array.from(porComprador.values())
      .map((r) => ({
        ...r,
        valorTotal: Math.round(r.valorTotal * 100) / 100,
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .map((r, i) => ({ posicao: i + 1, ...r }));

    return NextResponse.json({ ranking });
  } catch (error) {
    console.error("Erro ao obter ranking público:", error);
    return NextResponse.json(
      { error: "Erro ao carregar ranking" },
      { status: 500 }
    );
  }
}
