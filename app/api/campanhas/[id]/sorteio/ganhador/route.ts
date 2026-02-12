import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";

/** GET: retorna o nome do comprador que possui a cota informada (numero). Apenas dono da campanha. Números sem zero à esquerda (ex.: 1458). */
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
    const numero = request.nextUrl.searchParams.get("numero")?.trim();
    if (!campanhaId || !mongoose.Types.ObjectId.isValid(campanhaId)) {
      return NextResponse.json({ error: "Campanha inválida" }, { status: 400 });
    }
    if (!numero) {
      return NextResponse.json({ error: "Informe o número da cota" }, { status: 400 });
    }

    const numeroInt = parseInt(numero.replace(/\D/g, ""), 10);
    if (isNaN(numeroInt) || numeroInt < 1) {
      return NextResponse.json({ error: "Número inválido" }, { status: 400 });
    }

    await connectDB();

    const campanha = await Campanha.findOne({
      _id: campanhaId,
      userId: token.id,
    })
      .select("quantidadeTitulos")
      .lean();
    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const numeroNormalizado = String(numeroInt);

    const compra = await Compra.findOne({
      campanhaId: new mongoose.Types.ObjectId(campanhaId),
      status: { $in: ["paga", "simulada"] },
      numeros: numeroNormalizado,
    })
      .select("comprador.nome")
      .lean();

    if (!compra) {
      return NextResponse.json(
        { ganhador: null, message: "Nenhum comprador encontrado para esta cota." },
        { status: 200 }
      );
    }

    const nome = (compra as unknown as { comprador: { nome: string } }).comprador?.nome ?? "";
    return NextResponse.json({ ganhador: nome });
  } catch (error) {
    console.error("Erro ao buscar ganhador:", error);
    return NextResponse.json(
      { error: "Erro ao consultar cota" },
      { status: 500 }
    );
  }
}
