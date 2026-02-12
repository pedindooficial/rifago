import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";
import { docToCampanha } from "@/lib/campanhas-db";

async function getCampanhaDoUsuario(id: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const doc = await Campanha.findOne({ _id: id, userId }).lean();
  return docToCampanha(doc as Parameters<typeof docToCampanha>[0]);
}

/** Retorna totais de títulos vendidos, pendentes e valor arrecadado. */
async function getStatsCampanha(campanhaId: string): Promise<{
  titulosVendidos: number;
  titulosPendentes: number;
  valorArrecadado: number;
}> {
  const [vendidos, pendentes] = await Promise.all([
    Compra.aggregate([
      { $match: { campanhaId: new mongoose.Types.ObjectId(campanhaId), status: { $in: ["paga", "simulada"] } } },
      { $group: { _id: null, titulos: { $sum: "$quantidade" }, valor: { $sum: "$valorTotal" } } },
    ]).exec(),
    Compra.aggregate([
      { $match: { campanhaId: new mongoose.Types.ObjectId(campanhaId), status: "pendente" } },
      { $group: { _id: null, titulos: { $sum: "$quantidade" } } },
    ]).exec(),
  ]);
  return {
    titulosVendidos: vendidos[0]?.titulos ?? 0,
    titulosPendentes: pendentes[0]?.titulos ?? 0,
    valorArrecadado: Math.round((vendidos[0]?.valor ?? 0) * 100) / 100,
  };
}

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

    const { id } = await params;
    const campanha = await getCampanhaDoUsuario(id, token.id);
    if (!campanha) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }
    const stats = await getStatsCampanha(id);
    return NextResponse.json({ ...campanha, ...stats });
  } catch (error) {
    console.error("Erro ao obter campanha:", error);
    return NextResponse.json(
      { error: "Erro ao obter campanha" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    const data = await request.json();
    await connectDB();

    const stats = await getStatsCampanha(id);
    const temVendas = (stats.titulosVendidos ?? 0) > 0;

    const doc = await Campanha.findOneAndUpdate(
      { _id: id, userId: token.id },
      {
        $set: {
          ...(data.nome != null && { nome: data.nome }),
          ...(data.descricao !== undefined && { descricao: data.descricao }),
          ...(data.imagemUrl !== undefined && { imagemUrl: data.imagemUrl }),
          ...(data.tipoSorteio != null && { tipoSorteio: data.tipoSorteio }),
          ...(!temVendas && data.quantidadeTitulos != null && { quantidadeTitulos: data.quantidadeTitulos }),
          ...(data.valorPorTitulo !== undefined && { valorPorTitulo: data.valorPorTitulo }),
          ...(data.arrecadacaoEstimada != null && { arrecadacaoEstimada: data.arrecadacaoEstimada }),
          ...(data.taxa != null && { taxa: data.taxa }),
          ...(!temVendas && data.dataInicio !== undefined && { dataInicio: data.dataInicio }),
          ...(data.dataFim !== undefined && { dataFim: data.dataFim }),
          ...(data.tipoRealizacaoSorteio !== undefined && { tipoRealizacaoSorteio: data.tipoRealizacaoSorteio }),
          ...(data.dataSorteio !== undefined && { dataSorteio: data.dataSorteio }),
          ...(data.minutosPixExpirar !== undefined && { minutosPixExpirar: data.minutosPixExpirar }),
          ...(data.mercadoPagoHabilitado !== undefined && { mercadoPagoHabilitado: data.mercadoPagoHabilitado }),
          ...(data.mercadoPagoPublicKey !== undefined && { mercadoPagoPublicKey: data.mercadoPagoPublicKey }),
          ...(data.regulamento !== undefined && { regulamento: data.regulamento }),
          ...(data.prazoReservaExpirar !== undefined && { prazoReservaExpirar: data.prazoReservaExpirar }),
          ...(data.quantidadeMinimaReserva !== undefined && { quantidadeMinimaReserva: data.quantidadeMinimaReserva }),
          ...(data.quantidadeMaximaReserva !== undefined && { quantidadeMaximaReserva: data.quantidadeMaximaReserva }),
          ...(data.modoTitulos !== undefined && { modoTitulos: data.modoTitulos }),
          ...(data.progressoVisivel !== undefined && { progressoVisivel: data.progressoVisivel }),
          ...(data.rankingVisivel !== undefined && { rankingVisivel: data.rankingVisivel }),
          ...(data.premios !== undefined && { premios: data.premios }),
          ...(data.promocao !== undefined && { promocao: data.promocao }),
          ...(data.status != null && { status: data.status }),
        },
      },
      { new: true }
    ).lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }
    const campanha = docToCampanha(doc as Parameters<typeof docToCampanha>[0]);
    return NextResponse.json(campanha);
  } catch (error) {
    console.error("Erro ao atualizar campanha:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar campanha" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    await connectDB();
    const result = await Campanha.deleteOne({ _id: id, userId: token.id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Campanha deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar campanha:", error);
    return NextResponse.json(
      { error: "Erro ao deletar campanha" },
      { status: 500 }
    );
  }
}
