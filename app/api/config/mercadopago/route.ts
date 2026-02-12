import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import PagamentoConfig from "@/lib/models/PagamentoConfig";

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error("NEXTAUTH_SECRET não definido para a API de config do Mercado Pago");
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: JWT_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await connectDB();
  const cfg = await PagamentoConfig.findOne({ userId: token.id }).lean();

  if (!cfg) {
    return NextResponse.json({
      modo: "teste",
      chavePublicaTeste: "",
      chavePublicaProducao: "",
      accessTokenConfiguradoTeste: false,
      accessTokenConfiguradoProducao: false,
      tiposPagamento: "pix_e_cartao",
    });
  }

  const c = cfg as unknown as {
    mpModo?: string;
    mpPublicKey?: string;
    mpAccessToken?: string;
    mpPublicKeyTeste?: string;
    mpAccessTokenTeste?: string;
    mpPublicKeyProducao?: string;
    mpAccessTokenProducao?: string;
    tiposPagamento?: string;
  };

  // Retrocompat: se não tiver credenciais por modo, usa o valor único antigo
  const chavePublicaTeste =
    (c.mpPublicKeyTeste != null && c.mpPublicKeyTeste !== "") ? c.mpPublicKeyTeste : (c.mpPublicKey ?? "");
  const chavePublicaProducao =
    (c.mpPublicKeyProducao != null && c.mpPublicKeyProducao !== "") ? c.mpPublicKeyProducao : (c.mpPublicKey ?? "");
  const accessTokenConfiguradoTeste = Boolean(
    (c.mpAccessTokenTeste != null && String(c.mpAccessTokenTeste).trim() !== "") ||
    (c.mpAccessToken != null && String(c.mpAccessToken).trim() !== "" && c.mpModo === "teste")
  );
  const accessTokenConfiguradoProducao = Boolean(
    (c.mpAccessTokenProducao != null && String(c.mpAccessTokenProducao).trim() !== "") ||
    (c.mpAccessToken != null && String(c.mpAccessToken).trim() !== "" && c.mpModo === "producao")
  );

  return NextResponse.json({
    modo: c.mpModo ?? "teste",
    chavePublicaTeste,
    chavePublicaProducao,
    accessTokenConfiguradoTeste,
    accessTokenConfiguradoProducao,
    tiposPagamento: c.tiposPagamento ?? "pix_e_cartao",
  });
}

export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request, secret: JWT_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    modo: "producao" | "teste";
    chavePublica: string;
    accessToken: string;
    tiposPagamento: "pix_e_cartao" | "somente_pix" | "somente_cartao";
  };

  await connectDB();

  const update: Record<string, unknown> = {
    mpModo: body.modo,
    tiposPagamento: body.tiposPagamento,
  };

  // Atualiza apenas as credenciais do modo selecionado
  if (body.modo === "teste") {
    update.mpPublicKeyTeste = body.chavePublica?.trim() ?? "";
    if (body.accessToken != null && body.accessToken.trim() !== "") {
      update.mpAccessTokenTeste = body.accessToken.trim();
    }
  } else {
    update.mpPublicKeyProducao = body.chavePublica?.trim() ?? "";
    if (body.accessToken != null && body.accessToken.trim() !== "") {
      update.mpAccessTokenProducao = body.accessToken.trim();
    }
  }

  await PagamentoConfig.findOneAndUpdate(
    { userId: token.id },
    { $set: update },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}

