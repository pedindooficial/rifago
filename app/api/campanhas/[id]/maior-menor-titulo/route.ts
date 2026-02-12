import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";

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
      .select("numeros")
      .lean();

    const todosNumeros: string[] = [];
    for (const c of compras) {
      const nums = (c as { numeros?: string[] }).numeros ?? [];
      for (const n of nums) {
        const s = String(n).trim();
        if (s) todosNumeros.push(s);
      }
    }

    const quantidadeTitulos = (campanha as { quantidadeTitulos: number }).quantidadeTitulos;
    let menorTitulo: string | null = null;
    let maiorTitulo: string | null = null;

    if (todosNumeros.length > 0) {
      const ordenados = [...todosNumeros].sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10)
      );
      menorTitulo = ordenados[0];
      maiorTitulo = ordenados[ordenados.length - 1];
    }

    return NextResponse.json({
      menorTitulo,
      maiorTitulo,
      quantidadeTitulosVendidos: todosNumeros.length,
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
