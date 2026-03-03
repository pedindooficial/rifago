import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";
import { normalizarNumerosCotas } from "@/lib/formatadores";

/** GET: detalhes completos do usuário (campanhas, vendas/compras). */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    const { userId } = await context.params;
    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório." }, { status: 400 });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);
    await connectDB();

    const user = await User.findById(userObjId).select("email name createdAt twoFactorEnabled").lean();
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }
    const u = user as unknown as {
      _id: mongoose.Types.ObjectId;
      email: string;
      name: string;
      createdAt: Date;
      twoFactorEnabled?: boolean;
    };

    const campanhas = await Campanha.find({ userId: userObjId })
      .select("nome status quantidadeTitulos valorPorTitulo createdAt tipoSorteio")
      .sort({ createdAt: -1 })
      .lean();

    const campanhaIds = campanhas.map((c) => (c as unknown as { _id: mongoose.Types.ObjectId })._id);
    const nomesPorId: Record<string, string> = {};
    campanhas.forEach((c) => {
      const doc = c as unknown as { _id: mongoose.Types.ObjectId; nome: string };
      nomesPorId[doc._id.toString()] = doc.nome;
    });

    const compras = await Compra.find({
      campanhaId: { $in: campanhaIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const campanhasList = campanhas.map((c) => {
      const doc = c as unknown as {
        _id: mongoose.Types.ObjectId;
        nome: string;
        status: string;
        quantidadeTitulos: number;
        valorPorTitulo?: number;
        createdAt: Date;
        tipoSorteio: string;
      };
      return {
        id: doc._id.toString(),
        nome: doc.nome,
        status: doc.status,
        quantidadeTitulos: doc.quantidadeTitulos,
        valorPorTitulo: doc.valorPorTitulo ?? 0,
        createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
        tipoSorteio: doc.tipoSorteio,
      };
    });

    const comprasList = compras.map((c) => {
      const doc = c as unknown as {
        _id: mongoose.Types.ObjectId;
        campanhaId: mongoose.Types.ObjectId;
        comprador: { nome: string; cpf: string; email: string; telefone?: string };
        quantidade: number;
        numeros: string[];
        valorTotal: number;
        status: string;
        createdAt: Date;
      };
      return {
        id: doc._id.toString(),
        campanhaId: doc.campanhaId.toString(),
        campanhaNome: nomesPorId[doc.campanhaId.toString()] ?? "—",
        comprador: {
          nome: doc.comprador.nome,
          cpf: doc.comprador.cpf,
          email: doc.comprador.email,
          telefone: doc.comprador.telefone ?? "",
        },
        quantidade: doc.quantidade,
        numeros: normalizarNumerosCotas(doc.numeros),
        valorTotal: doc.valorTotal,
        status: doc.status,
        createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      };
    });

    return NextResponse.json({
      user: {
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
        twoFactorEnabled: u.twoFactorEnabled ?? false,
      },
      campanhas: campanhasList,
      compras: comprasList,
    });
  } catch (error) {
    console.error("Erro ao obter detalhes do usuário:", error);
    return NextResponse.json({ error: "Erro ao carregar dados do usuário." }, { status: 500 });
  }
}
