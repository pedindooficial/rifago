import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import PagamentoConfig from "@/lib/models/PagamentoConfig";
import Compra from "@/lib/models/Compra";
import { parsePromocaoFromString, valorTotalComPromocao } from "@/lib/promocao";

type Body = {
  campanhaId: string;
  quantidade: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
};

/** Normaliza número para formato sem zero à esquerda (ex.: 7994, não 07994). */
function numeroSemZero(n: string | number): string {
  return String(parseInt(String(n).trim(), 10) || 0);
}

/** Retorna números disponíveis (1..quantidadeTitulos) que ainda não foram vendidos. Sem zero à esquerda. */
function numerosDisponiveis(
  quantidadeTitulos: number,
  numerosVendidos: Set<string>
): string[] {
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const { campanhaId, quantidade, nome, cpf, email, telefone } = body;

    if (!campanhaId || !mongoose.Types.ObjectId.isValid(campanhaId)) {
      return NextResponse.json({ error: "Campanha inválida" }, { status: 400 });
    }
    if (!quantidade || quantidade < 1) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
    }
    if (!nome?.trim() || !cpf?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Informe nome, CPF e e-mail" },
        { status: 400 }
      );
    }

    const cpfNumeros = cpf.replace(/\D/g, "");
    if (cpfNumeros.length !== 11) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    await connectDB();

    const campanhaRaw = await Campanha.findOne({
      _id: campanhaId,
      status: "ativa",
    }).lean();
    const campanha = campanhaRaw as { valorPorTitulo?: number; userId?: unknown; quantidadeTitulos?: number } | null;
    if (!campanha || typeof campanha.valorPorTitulo !== "number") {
      return NextResponse.json(
        { error: "Campanha não encontrada ou não está ativa" },
        { status: 404 }
      );
    }

    const cfg = await PagamentoConfig.findOne({ userId: campanha.userId }).lean();
    if (!cfg || cfg.mpModo !== "teste") {
      return NextResponse.json(
        {
          error:
            "Simulação de pagamento só está disponível quando o organizador está em modo Teste (Configuração → Meios de pagamento).",
        },
        { status: 400 }
      );
    }

    const totalTitulos = campanha.quantidadeTitulos;
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
      for (const n of c.numeros || []) numerosVendidos.add(numeroSemZero(n));
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

    const modoTitulos = campanha.modoTitulos ?? "aleatorios";
    const numerosAtribuidos =
      modoTitulos === "aleatorios"
        ? shuffle(disponiveis).slice(0, quantidade)
        : disponiveis.slice(0, quantidade);

    const promocoes = parsePromocaoFromString(campanha.promocao);
    const valorTotal = valorTotalComPromocao(
      promocoes,
      quantidade,
      campanha.valorPorTitulo
    );

    const compra = await Compra.create({
      campanhaId: new mongoose.Types.ObjectId(campanhaId),
      comprador: {
        nome: nome.trim(),
        cpf: cpfNumeros,
        email: email.trim().toLowerCase(),
        telefone: telefone?.trim() || undefined,
      },
      quantidade,
      numeros: numerosAtribuidos,
      valorTotal,
      status: "simulada",
    });

    return NextResponse.json({
      compraId: compra._id.toString(),
      numeros: numerosAtribuidos,
      valorTotal,
      campanhaNome: campanha.nome,
    });
  } catch (error) {
    console.error("Erro ao simular compra:", error);
    return NextResponse.json(
      { error: "Erro ao simular pagamento. Tente novamente." },
      { status: 500 }
    );
  }
}
