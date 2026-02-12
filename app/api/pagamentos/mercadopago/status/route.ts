import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import PixSession from "@/lib/models/PixSession";
import PagamentoConfig from "@/lib/models/PagamentoConfig";

/** GET: verifica status do pagamento no Mercado Pago (público, token na query) */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token || !mongoose.Types.ObjectId.isValid(token)) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    await connectDB();
    const session = await PixSession.findById(token).lean();
    if (!session) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 404 });
    }

    const s = session as unknown as { pagamentoId: string; userId: unknown };
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
    if (!cfg || !accessToken || String(accessToken).trim() === "") {
      return NextResponse.json({ status: "pending" });
    }
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${s.pagamentoId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ status: "pending" });
    }

    const payment = (await res.json()) as { status?: string };
    const status = payment.status ?? "pending";

    return NextResponse.json({
      status,
      approved: status === "approved",
    });
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    return NextResponse.json({ status: "pending" });
  }
}
