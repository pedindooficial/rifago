import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";

/** POST: aprova manualmente uma compra pendente (marca como paga). Apenas dono da campanha. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; compraId: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: campanhaId, compraId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(campanhaId) || !mongoose.Types.ObjectId.isValid(compraId)) {
      return NextResponse.json({ error: "Campanha ou compra inválida" }, { status: 400 });
    }

    await connectDB();

    const campanha = await Campanha.findOne({
      _id: campanhaId,
      userId: token.id,
    }).lean();
    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const result = await Compra.updateOne(
      {
        _id: compraId,
        campanhaId: new mongoose.Types.ObjectId(campanhaId),
        status: "pendente",
      },
      { $set: { status: "paga" } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Compra não encontrada ou não está pendente" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Compra aprovada com sucesso." });
  } catch (error) {
    console.error("Erro ao aprovar compra:", error);
    return NextResponse.json(
      { error: "Erro ao aprovar compra. Tente novamente." },
      { status: 500 }
    );
  }
}
