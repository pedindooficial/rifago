import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";
import type { StatusCompra } from "@/lib/models/Compra";

/** GET: retorna o menor e o maior título/cota vendido ou reservado (paga, simulada, pendente). Apenas dono da campanha. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: campanhaId } = await params;
    if (!mongoose.Types.ObjectId.isValid(campanhaId)) {
      return NextResponse.json({ error: "Campanha inválida" }, { status: 400 });
    }

    await connectDB();

    const campanha = await Campanha.findOne({
      _id: campanhaId,
      userId: token.id,
    })
      .select("quantidadeTitulos nome")
      .lean();
    if (!campanha) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    const compras = await Compra.find({
      campanhaId: new mongoose.Types.ObjectId(campanhaId),
      status: { $in: ["paga", "simulada", "pendente"] },
    })
      .select("numeros comprador.nome quantidade valorTotal status createdAt")
      .lean();

    type CompraLean = {
      numeros?: (string | number)[];
      comprador?: { nome?: string };
      quantidade?: number;
      valorTotal?: number;
      status?: StatusCompra;
      createdAt?: Date;
    };

    const quantidadeTitulos = (campanha as unknown as { quantidadeTitulos: number }).quantidadeTitulos;

    type InfoTitulo = {
      numero: string;
      compradorNome: string | null;
      quantidade: number | null;
      valorTotal: number | null;
      status: StatusCompra | null;
      createdAt: string | null;
    };

    let menor: { valor: number; info: InfoTitulo } | null = null;
    let maior: { valor: number; info: InfoTitulo } | null = null;
    let totalNumeros = 0;

    for (const compraDoc of compras as unknown as CompraLean[]) {
      const nums = Array.isArray(compraDoc.numeros) ? compraDoc.numeros : [];
      for (const n of nums) {
        const s = String(n).trim();
        if (!s) continue;
        const v = parseInt(s, 10);
        if (!Number.isFinite(v)) continue;
        totalNumeros += 1;

        const baseInfo: InfoTitulo = {
          numero: s,
          compradorNome: compraDoc.comprador?.nome?.trim() || null,
          quantidade: typeof compraDoc.quantidade === "number" ? compraDoc.quantidade : null,
          valorTotal: typeof compraDoc.valorTotal === "number" ? compraDoc.valorTotal : null,
          status: compraDoc.status ?? null,
          createdAt: compraDoc.createdAt ? compraDoc.createdAt.toISOString() : null,
        };

        if (!menor || v < menor.valor) {
          menor = { valor: v, info: baseInfo };
        }
        if (!maior || v > maior.valor) {
          maior = { valor: v, info: baseInfo };
        }
      }
    }

    return NextResponse.json({
      menorTitulo: menor?.info ?? null,
      maiorTitulo: maior?.info ?? null,
      quantidadeTitulosVendidos: totalNumeros,
      quantidadeTitulosCampanha: quantidadeTitulos,
    });
  } catch (error) {
    console.error("Erro ao obter maior/menor título:", error);
    return NextResponse.json(
      { error: "Erro ao consultar títulos" },
      { status: 500 }
    );
  }
}
