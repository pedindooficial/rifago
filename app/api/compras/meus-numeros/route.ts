import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Compra from "@/lib/models/Compra";
import Campanha from "@/lib/models/Campanha";
import { normalizarNumerosCotas } from "@/lib/formatadores";

/**
 * Área do comprador: busca compras por CPF + e-mail (compras pagas ou simuladas).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { cpf?: string; email?: string };
    const cpf = typeof body.cpf === "string" ? body.cpf.replace(/\D/g, "") : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (cpf.length !== 11) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    }

    await connectDB();

    const comprasDoc = await Compra.find({
      "comprador.cpf": cpf,
      "comprador.email": email.toLowerCase(),
      status: { $in: ["paga", "simulada"] },
    })
      .select("campanhaId numeros valorTotal quantidade")
      .lean();

    const campanhaIds = [
      ...new Set(
        comprasDoc.map((c) => (c as unknown as { campanhaId: mongoose.Types.ObjectId }).campanhaId.toString())
      ),
    ];
    const campanhas = await Campanha.find({ _id: { $in: campanhaIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .select("nome")
      .lean();
    const nomesPorId = Object.fromEntries(
      campanhas.map((c) => [(c as unknown as { _id: mongoose.Types.ObjectId })._id.toString(), (c as unknown as { nome: string }).nome])
    );

    const porCampanha = new Map<
      string,
      { campanhaNome: string; numeros: string[]; valorTotal: number; quantidadeTotal: number }
    >();
    for (const c of comprasDoc) {
      const doc = c as unknown as {
        campanhaId: mongoose.Types.ObjectId;
        numeros: string[];
        valorTotal?: number;
        quantidade?: number;
      };
      const id = doc.campanhaId.toString();
      const numeros = normalizarNumerosCotas(doc.numeros);
      const valorTotal = Number(doc.valorTotal) || 0;
      const quantidade = Number(doc.quantidade) || numeros.length;
      const existente = porCampanha.get(id);
      if (existente) {
        existente.numeros.push(...numeros);
        existente.valorTotal += valorTotal;
        existente.quantidadeTotal += quantidade;
      } else {
        porCampanha.set(id, {
          campanhaNome: nomesPorId[id] ?? "Campanha",
          numeros: [...numeros],
          valorTotal,
          quantidadeTotal: quantidade,
        });
      }
    }
    const compras = Array.from(porCampanha.entries()).map(([campanhaId, v]) => ({
      campanhaId,
      campanhaNome: v.campanhaNome,
      numeros: v.numeros.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })),
      valorTotal: Math.round(v.valorTotal * 100) / 100,
      quantidadeTotal: v.quantidadeTotal,
    }));

    const totais = {
      campanhas: compras.length,
      cotas: compras.reduce((s, c) => s + c.numeros.length, 0),
      valorTotal: Math.round(compras.reduce((s, c) => s + c.valorTotal, 0) * 100) / 100,
    };

    return NextResponse.json({ compras, totais });
  } catch (error) {
    console.error("Erro ao buscar meus números:", error);
    return NextResponse.json(
      { error: "Erro ao buscar seus números" },
      { status: 500 }
    );
  }
}
