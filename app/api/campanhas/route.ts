import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";
import { docToCampanha } from "@/lib/campanhas-db";
import type { CriarCampanhaData } from "@/lib/api";

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
    const docs = await Campanha.find({ userId: token.id })
      .sort({ createdAt: -1 })
      .lean();

    // Calcula títulos vendidos e valor arrecadado por campanha (pagas + simuladas)
    const ids = docs.map((d) => d._id).filter(Boolean);
    let statsPorCampanha: Record<
      string,
      { titulosVendidos: number; valorArrecadado: number }
    > = {};

    if (ids.length > 0) {
      const stats = await Compra.aggregate([
        {
          $match: {
            campanhaId: { $in: ids },
            status: { $in: ["paga", "simulada"] },
          },
        },
        {
          $group: {
            _id: "$campanhaId",
            titulosVendidos: { $sum: "$quantidade" },
            valorArrecadado: { $sum: "$valorTotal" },
          },
        },
      ]).exec();

      statsPorCampanha = Object.fromEntries(
        stats.map((s) => [
          String(s._id),
          {
            titulosVendidos: s.titulosVendidos ?? 0,
            valorArrecadado:
              Math.round((s.valorArrecadado ?? 0) * 100) / 100,
          },
        ])
      );
    }

    const campanhas = docs
      .map((d) => {
        const base = docToCampanha(d as unknown as Parameters<typeof docToCampanha>[0]);
        if (!base) return null;
        const stats = statsPorCampanha[String(d._id)] ?? {
          titulosVendidos: 0,
          valorArrecadado: 0,
        };
        return { ...base, ...stats };
      })
      .filter(Boolean);

    return NextResponse.json(campanhas);
  } catch (error) {
    console.error("Erro ao listar campanhas:", error);
    return NextResponse.json(
      { error: "Erro ao listar campanhas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data: CriarCampanhaData = await req.json();
    await connectDB();

    const doc = await Campanha.create({
      userId: token.id,
      nome: data.nome,
      descricao: data.descricao,
      imagemUrl: data.imagemUrl,
      tipoSorteio: data.tipoSorteio,
      quantidadeTitulos: data.quantidadeTitulos,
      valorPorTitulo: data.valorPorTitulo,
      arrecadacaoEstimada: data.arrecadacaoEstimada,
      taxa: data.taxa,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      tipoRealizacaoSorteio: data.tipoRealizacaoSorteio,
      dataSorteio: data.dataSorteio,
      minutosPixExpirar: data.minutosPixExpirar,
      mercadoPagoHabilitado: data.mercadoPagoHabilitado,
      mercadoPagoPublicKey: data.mercadoPagoPublicKey,
      regulamento: data.regulamento,
      prazoReservaExpirar: data.prazoReservaExpirar,
      quantidadeMinimaReserva: data.quantidadeMinimaReserva,
      quantidadeMaximaReserva: data.quantidadeMaximaReserva,
      modoTitulos: data.modoTitulos ?? "aleatorios",
      progressoVisivel: data.progressoVisivel ?? false,
      premios: data.premios,
      promocao: data.promocao,
      status: "rascunho",
    });

    const campanha = docToCampanha(doc as unknown as Parameters<typeof docToCampanha>[0]);
    return NextResponse.json(campanha, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar campanha:", error);
    return NextResponse.json(
      { error: "Erro ao criar campanha" },
      { status: 500 }
    );
  }
}
