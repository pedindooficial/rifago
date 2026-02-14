import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";
import PagamentoConfig from "@/lib/models/PagamentoConfig";
import PixSession from "@/lib/models/PixSession";
import { parsePromocaoFromString, valorTotalComPromocao } from "@/lib/promocao";

function mascararCpf(cpf: string): string {
  const n = cpf.replace(/\D/g, "").slice(-4);
  return `***.***.***-${n}`;
}

/** Normaliza número para formato sem zero à esquerda (ex.: 7994, não 07994). */
function numeroSemZero(n: string | number): string {
  return String(parseInt(String(n).trim(), 10) || 0);
}

function numerosDisponiveis(quantidadeTitulos: number, numerosVendidos: Set<string>): string[] {
  const disponiveis: string[] = [];
  for (let i = 1; i <= quantidadeTitulos; i++) {
    const num = String(i);
    if (!numerosVendidos.has(num)) disponiveis.push(num);
  }
  return disponiveis;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Body = {
  campanhaId: string;
  quantidade: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
};

export async function POST(request: NextRequest) {
  try {
    const { campanhaId, quantidade, nome, cpf, email, telefone }: Body = await request.json();

    if (!campanhaId || !mongoose.Types.ObjectId.isValid(campanhaId)) {
      return NextResponse.json({ error: "Campanha inválida" }, { status: 400 });
    }
    if (!quantidade || quantidade < 1) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
    }
    if (!nome || !cpf || !email) {
      return NextResponse.json(
        { error: "Informe nome, CPF e e-mail para gerar o PIX" },
        { status: 400 }
      );
    }

    const cpfNumeros = cpf.replace(/\D/g, "");
    if (cpfNumeros.length !== 11) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    await connectDB();
    const docRaw = await Campanha.findOne({ _id: campanhaId, status: "ativa" }).lean();
    type DocLean = {
      valorPorTitulo?: number;
      userId?: unknown;
      nome?: string;
      promocao?: string;
      quantidadeTitulos?: number;
      modoTitulos?: string;
      minutosPixExpirar?: number;
      _id?: unknown;
    };
    const doc = docRaw as DocLean | null;
    if (!doc || typeof doc.valorPorTitulo !== "number") {
      return NextResponse.json(
        { error: "Campanha não encontrada ou não está ativa" },
        { status: 404 }
      );
    }

    const cfg = await PagamentoConfig.findOne({ userId: doc.userId }).lean();
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
      console.error("Configuração Mercado Pago não encontrada ou sem Access Token para o usuário", doc.userId);
      return NextResponse.json(
        {
          error:
            "O organizador desta campanha ainda não configurou o Mercado Pago (ou o Access Token está vazio). Entre na sua conta como organizador, vá em Configuração → Meios de pagamento, selecione o modo (Teste ou Produção) e preencha Chave pública e Access Token.",
        },
        { status: 500 }
      );
    }

    const unitPrice = doc.valorPorTitulo;
    const promocoes = parsePromocaoFromString(doc.promocao);
    const transactionAmount = valorTotalComPromocao(promocoes, quantidade, unitPrice);
    const description = doc.nome ?? "Campanha";

    const minutosPix = doc.minutosPixExpirar ?? 30;
    const dateOfExpiration = new Date(Date.now() + minutosPix * 60 * 1000).toISOString();

    const paymentBody: any = {
      transaction_amount: transactionAmount,
      description,
      payment_method_id: "pix",
      date_of_expiration: dateOfExpiration,
      payer: {
        email,
        first_name: nome,
        identification: {
          type: "CPF",
          number: cpfNumeros,
        },
      },
    };

    if (telefone) {
      paymentBody.payer.phone = {
        number: telefone.replace(/\D/g, ""),
      };
    }

    // Mercado Pago exige X-Idempotency-Key único por requisição para evitar cobranças duplicadas
    const idempotencyKey = crypto.randomUUID();

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const json = (await mpResponse.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
      cause?: Array<{ code?: number; description?: string }>;
    };

    if (!mpResponse.ok) {
      console.error("Erro ao criar pagamento PIX Mercado Pago:", json ?? mpResponse.statusText);
      const msg = json?.message ?? json?.error ?? String(json ?? mpResponse.statusText);

      // Se o Mercado Pago disser que é \"live credentials\", apenas repassamos a mensagem
      // original sem mexer no token salvo. Isso evita ficar apagando o token toda vez.
      const isLiveCreds =
        mpResponse.status === 401 &&
        (msg.toLowerCase().includes("live credentials") ||
          msg.toLowerCase().includes("credenciais de produção"));

      const errorMessage = isLiveCreds
        ? `O Mercado Pago recusou este Access Token com o erro: \"${msg}\". A integração está chamando a API corretamente com o token que você salvou em Configuração → Meios de pagamento. Confirme no painel do Mercado Pago se este Access Token é realmente o de TESTE; se for, será necessário abrir um chamado com o suporte do Mercado Pago informando esse erro (401 Unauthorized use of live credentials).`
        : `Erro ao criar pagamento PIX no Mercado Pago: ${msg}`;

      return NextResponse.json(
        { error: errorMessage, details: json },
        { status: mpResponse.status === 401 ? 400 : 500 }
      );
    }

    const jsonWithPoi = json as { point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } } };
    const tx = jsonWithPoi?.point_of_interaction?.transaction_data;
    const qrCode = tx?.qr_code ?? null;
    const qrCodeBase64 = tx?.qr_code_base64 ?? null;
    // Link do Mercado Pago para o comprador abrir e pagar (em teste pode ser /sandbox/payments/...)
    let ticketUrl = (tx as { ticket_url?: string })?.ticket_url ?? null;
    if (ticketUrl && modo === "teste") {
      // Em modo teste, garantir que seja o link do sandbox para simular o pagamento
      ticketUrl = ticketUrl.replace(
        "mercadopago.com.br/payments/",
        "mercadopago.com.br/sandbox/payments/"
      );
    }

    if (!qrCode) {
      console.error("Pagamento PIX criado mas sem qr_code retornado:", json);
      return NextResponse.json(
        { error: "Não foi possível obter os dados do PIX" },
        { status: 500 }
      );
    }

    const paymentId = String((json as { id?: number }).id);
    const totalTitulos = (doc as unknown as { quantidadeTitulos: number }).quantidadeTitulos;
    if (quantidade > totalTitulos) {
      return NextResponse.json(
        { error: `Quantidade maior que o total de títulos (${totalTitulos})` },
        { status: 400 }
      );
    }

    const comprasExistentes = await Compra.find({
      campanhaId: new mongoose.Types.ObjectId(campanhaId),
      status: { $in: ["paga", "simulada", "pendente"] },
    })
      .select("numeros")
      .lean();
    const numerosVendidos = new Set<string>();
    for (const c of comprasExistentes) {
      const nums = (c as unknown as { numeros?: string[] }).numeros ?? [];
      for (const n of nums) numerosVendidos.add(numeroSemZero(n));
    }
    const disponiveis = numerosDisponiveis(totalTitulos, numerosVendidos);
    if (disponiveis.length < quantidade) {
      return NextResponse.json(
        {
          error: `Não há números suficientes disponíveis. Disponíveis: ${disponiveis.length}, solicitados: ${quantidade}.`,
        },
        { status: 400 }
      );
    }
    const modoTitulos = (doc as unknown as { modoTitulos?: "aleatorios" | "expostos" }).modoTitulos ?? "aleatorios";
    const numerosAtribuidos =
      modoTitulos === "aleatorios"
        ? shuffle(disponiveis).slice(0, quantidade)
        : disponiveis.slice(0, quantidade);

    await Compra.create({
      campanhaId: new mongoose.Types.ObjectId(campanhaId),
      comprador: {
        nome: nome.trim(),
        cpf: cpfNumeros,
        email: email.trim().toLowerCase(),
        telefone: telefone?.trim() || undefined,
      },
      quantidade,
      numeros: numerosAtribuidos,
      valorTotal: transactionAmount,
      status: "pendente",
      pagamentoId: paymentId,
    });

    const sessionDoc = await PixSession.create({
      pagamentoId: paymentId,
      qrCode,
      qrCodeBase64: qrCodeBase64 ?? null,
      ticketUrl: ticketUrl || undefined,
      modo: modo ?? "teste",
      campanhaId: doc._id ?? campanhaId,
      userId: doc.userId,
      campanhaNome: description,
      minutosPixExpirar: minutosPix,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      cpfMascarado: mascararCpf(cpfNumeros),
      quantidade,
      valorTotal: transactionAmount,
    });

    return NextResponse.json({
      token: sessionDoc._id.toString(),
      pagamentoId: paymentId,
      qrCode,
      qrCodeBase64,
      ticketUrl: ticketUrl || undefined,
      modo,
    });
  } catch (error) {
    console.error("Erro no checkout PIX Mercado Pago:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno no checkout PIX Mercado Pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

