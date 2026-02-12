import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import PixSession from "@/lib/models/PixSession";

/** GET: retorna dados da sessão PIX para exibição na página de pagamento (público, token na query) */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token || !mongoose.Types.ObjectId.isValid(token)) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    await connectDB();
    const session = await PixSession.findById(token).lean();
    if (!session) {
      return NextResponse.json({ error: "Sessão expirada ou não encontrada" }, { status: 404 });
    }

    const s = session as {
      _id: unknown;
      pagamentoId: string;
      qrCode: string;
      qrCodeBase64: string | null;
      ticketUrl?: string;
      modo: string;
      campanhaId: unknown;
      campanhaNome: string;
      minutosPixExpirar: number;
      nome: string;
      email: string;
      cpfMascarado: string;
      quantidade: number;
      valorTotal: number;
    };

    return NextResponse.json({
      token: String(s._id),
      pagamentoId: s.pagamentoId,
      qrCode: s.qrCode,
      qrCodeBase64: s.qrCodeBase64,
      ticketUrl: s.ticketUrl,
      modo: s.modo,
      campanhaId: String(s.campanhaId),
      campanhaNome: s.campanhaNome,
      minutosPixExpirar: s.minutosPixExpirar,
      nome: s.nome,
      email: s.email,
      cpfMascarado: s.cpfMascarado,
      quantidade: s.quantidade,
      valorTotal: s.valorTotal,
    });
  } catch (error) {
    console.error("Erro ao obter sessão PIX:", error);
    return NextResponse.json({ error: "Erro ao carregar sessão" }, { status: 500 });
  }
}
