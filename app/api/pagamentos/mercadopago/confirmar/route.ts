import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Compra from "@/lib/models/Compra";
import PixSession from "@/lib/models/PixSession";
import PagamentoConfig from "@/lib/models/PagamentoConfig";

/** POST: confirma pagamento aprovado no MP e atualiza a Compra para status "paga" (público, token no body). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = (body as { token?: string }).token ?? request.nextUrl.searchParams.get("token");
    if (!token || !mongoose.Types.ObjectId.isValid(token)) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    await connectDB();
    const session = await PixSession.findById(token).lean();
    if (!session) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 404 });
    }

    const s = session as unknown as { pagamentoId: string; campanhaId: mongoose.Types.ObjectId; userId: unknown };
    const cfg = await PagamentoConfig.findOne({ userId: s.userId })
      .select("mpModo mpAccessToken mpAccessTokenTeste mpAccessTokenProducao")
      .lean();
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
    if (cfg && accessToken && String(accessToken).trim() !== "") {
      const res = await fetch(
        `https://api.mercadopago.com/v1/payments/${s.pagamentoId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.ok) {
        const payment = (await res.json()) as { status?: string };
        if (payment.status !== "approved") {
          return NextResponse.json({ confirmed: false, status: payment.status ?? "pending" });
        }
      }
    }

    const result = await Compra.updateOne(
      {
        campanhaId: s.campanhaId,
        pagamentoId: s.pagamentoId,
        status: "pendente",
      },
      { $set: { status: "paga" } }
    );

    return NextResponse.json({
      confirmed: result.modifiedCount > 0 || result.matchedCount > 0,
    });
  } catch (error) {
    console.error("Erro ao confirmar pagamento:", error);
    return NextResponse.json({ error: "Erro ao confirmar pagamento" }, { status: 500 });
  }
}
