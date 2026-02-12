import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";
import RedesSociaisConfig from "@/lib/models/RedesSociaisConfig";
import { docToCampanha } from "@/lib/campanhas-db";

async function getStatsCampanha(campanhaId: string): Promise<{
  titulosVendidos: number;
  valorArrecadado: number;
  titulosPendentes: number;
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
    valorArrecadado: Math.round((vendidos[0]?.valor ?? 0) * 100) / 100,
    titulosPendentes: pendentes[0]?.titulos ?? 0,
  };
}

/** GET: retorna campanha pública por ID — apenas se status === "ativa" (sem auth) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }
    await connectDB();
    const doc = await Campanha.findOne({
      _id: id,
      status: "ativa",
    })
      .lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Campanha não encontrada ou não está ativa" },
        { status: 404 }
      );
    }
    const campanha = docToCampanha(doc as Parameters<typeof docToCampanha>[0]);
    const stats = await getStatsCampanha(id);
    const docWithUserId = doc as { userId?: unknown };
    let redesSociais: Record<string, string> = {};
    if (docWithUserId.userId) {
      const redes = await RedesSociaisConfig.findOne({ userId: docWithUserId.userId }).lean();
      if (redes) {
        const r = redes as Record<string, string | undefined>;
        ["facebook", "instagram", "twitter", "whatsapp", "whatsappGrupo", "youtube", "tiktok", "linkedin"].forEach((key) => {
          const v = r[key];
          if (v && String(v).trim() !== "") redesSociais[key] = String(v).trim();
        });
      }
    }
    return NextResponse.json({ ...campanha, ...stats, redesSociais });
  } catch (error) {
    console.error("Erro ao obter campanha pública:", error);
    return NextResponse.json(
      { error: "Erro ao obter campanha" },
      { status: 500 }
    );
  }
}
