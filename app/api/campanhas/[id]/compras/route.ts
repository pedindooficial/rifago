import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";

/** GET: lista compras da campanha (apenas dono da campanha). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: campanhaId } = await params;
    if (!mongoose.Types.ObjectId.isValid(campanhaId)) {
      return NextResponse.json({ error: "Campanha inválida" }, { status: 400 });
    }

    await connectDB();

    const campanha = await Campanha.findOne({
      _id: campanhaId,
      userId: token.id,
    }).lean();
    if (!campanha) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    const compras = await Compra.find({
      campanhaId: new mongoose.Types.ObjectId(campanhaId),
      status: { $in: ["paga", "simulada", "pendente", "cancelada"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const itens = compras.map((c) => ({
      id: (c as { _id: mongoose.Types.ObjectId })._id.toString(),
      comprador: (c as { comprador: { nome: string; cpf: string; email: string; telefone?: string } }).comprador,
      quantidade: (c as { quantidade: number }).quantidade,
      numeros: (c as { numeros: string[] }).numeros,
      valorTotal: (c as { valorTotal: number }).valorTotal,
      status: (c as { status: string }).status,
      createdAt: (c as { createdAt: Date }).createdAt,
    }));

    return NextResponse.json({ compras: itens });
  } catch (error) {
    console.error("Erro ao listar compras:", error);
    return NextResponse.json(
      { error: "Erro ao listar vendas" },
      { status: 500 }
    );
  }
}
