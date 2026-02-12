import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import PagamentoConfig from "@/lib/models/PagamentoConfig";

type Body = {
  campanhaId: string;
  quantidade: number;
};

export async function POST(request: NextRequest) {
  try {
    const { campanhaId, quantidade }: Body = await request.json();

    if (!campanhaId || !mongoose.Types.ObjectId.isValid(campanhaId)) {
      return NextResponse.json({ error: "Campanha inválida" }, { status: 400 });
    }
    if (!quantidade || quantidade < 1) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
    }

    await connectDB();
    const doc = await Campanha.findOne({ _id: campanhaId, status: "ativa" }).lean();
    if (!doc || typeof doc.valorPorTitulo !== "number") {
      return NextResponse.json(
        { error: "Campanha não encontrada ou não está ativa" },
        { status: 404 }
      );
    }

    const cfg = await PagamentoConfig.findOne({ userId: doc.userId }).lean();
    if (!cfg || !cfg.mpAccessToken) {
      console.error("Configuração Mercado Pago não encontrada para o usuário", doc.userId);
      return NextResponse.json(
        { error: "Configure o Mercado Pago em Configuração → Meios de pagamento" },
        { status: 500 }
      );
    }

    const unitPrice = doc.valorPorTitulo;
    const title = doc.nome ?? "Campanha";

    // URL absoluta válida para redirecionar de volta para a rifa
    const url = new URL(request.url);
    const base = `${url.protocol}//${url.host}`;
    const successUrl = `${base}/rifa/${campanhaId}`;
    const failureUrl = `${base}/rifa/${campanhaId}`;

    const prefResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.mpAccessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title,
            quantity: quantidade,
            unit_price: unitPrice,
            currency_id: "BRL",
          },
        ],
        // back_urls são opcionais; removemos auto_return para evitar erro de validação
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: successUrl,
        },
      }),
    });

    if (!prefResponse.ok) {
      const text = await prefResponse.text();
      console.error("Erro ao criar preferência Mercado Pago:", text);
      return NextResponse.json(
        {
          error: "Erro ao criar cobrança no Mercado Pago",
          details: text,
        },
        { status: 500 }
      );
    }

    const prefJson = (await prefResponse.json()) as { init_point?: string; sandbox_init_point?: string };
    const initPoint = prefJson.init_point ?? prefJson.sandbox_init_point;

    if (!initPoint) {
      console.error("Preferência Mercado Pago sem init_point:", prefJson);
      return NextResponse.json(
        { error: "Não foi possível obter o link de pagamento" },
        { status: 500 }
      );
    }

    return NextResponse.json({ initPoint });
  } catch (error) {
    console.error("Erro no checkout Mercado Pago:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno no checkout Mercado Pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

