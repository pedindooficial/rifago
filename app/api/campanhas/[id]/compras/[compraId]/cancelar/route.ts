import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";
import PagamentoConfig from "@/lib/models/PagamentoConfig";

/** POST: cancela a compra (reembolso se paga via PIX, libera cotas). Body: { forcar?: boolean } = pular reembolso MP e apenas cancelar. */
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

    let forcar = false;
    try {
      const body = await request.json().catch(() => ({}));
      forcar = !!(body && (body as { forcar?: boolean }).forcar);
    } catch {
      // no body
    }

    await connectDB();

    const campanha = await Campanha.findOne({
      _id: campanhaId,
      userId: token.id,
    }).lean();
    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const compra = await Compra.findOne({
      _id: compraId,
      campanhaId: new mongoose.Types.ObjectId(campanhaId),
      status: { $in: ["paga", "simulada", "pendente"] },
    }).lean();

    if (!compra) {
      return NextResponse.json(
        { error: "Compra não encontrada ou já cancelada" },
        { status: 404 }
      );
    }

    const doc = compra as unknown as {
      status: string;
      pagamentoId?: string;
    };

    if (!forcar && doc.status === "paga" && doc.pagamentoId?.trim()) {
      const cfg = await PagamentoConfig.findOne({ userId: token.id }).lean();
      const cfgAny = cfg as unknown as {
        mpModo?: "teste" | "producao";
        mpAccessToken?: string;
        mpAccessTokenTeste?: string;
        mpAccessTokenProducao?: string;
      } | null;
      const modo = cfgAny?.mpModo ?? "teste";
      const accessToken =
        modo === "teste"
          ? (cfgAny?.mpAccessTokenTeste ?? cfgAny?.mpAccessToken ?? "")
          : (cfgAny?.mpAccessTokenProducao ?? cfgAny?.mpAccessToken ?? "");

      if (accessToken?.trim()) {
        const baseUrl =
          modo === "teste"
            ? "https://api.mercadopago.com"
            : "https://api.mercadopago.com";
        const refundRes = await fetch(
          `${baseUrl}/v1/payments/${doc.pagamentoId}/refunds`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken.trim()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          }
        );
        if (!refundRes.ok) {
          const errBody = await refundRes.text();
          console.error("Mercado Pago refund error:", refundRes.status, errBody);
          return NextResponse.json(
            { error: "Não foi possível processar o reembolso no Mercado Pago. Tente novamente ou cancele manualmente." },
            { status: 502 }
          );
        }
      }
    }

    await Compra.updateOne(
      { _id: compraId, campanhaId: new mongoose.Types.ObjectId(campanhaId) },
      { $set: { status: "cancelada" } }
    );

    return NextResponse.json({ ok: true, message: "Compra cancelada com sucesso." });
  } catch (error) {
    console.error("Erro ao cancelar compra:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar compra. Tente novamente." },
      { status: 500 }
    );
  }
}
