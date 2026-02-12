import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import SupportMessage from "@/lib/models/SupportMessage";

/** GET: usuário logado vê suas mensagens com o suporte. */
export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const userId = token.id as string;
  try {
    await connectDB();
    const messages = await SupportMessage.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: 1 })
      .lean();
    const list = messages.map((m) => {
      const doc = m as { sender: string; content: string; createdAt: Date };
      return {
        sender: doc.sender,
        content: doc.content,
        createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
      };
    });
    return NextResponse.json({ messages: list });
  } catch (error) {
    console.error("Erro ao listar mensagens suporte:", error);
    return NextResponse.json({ error: "Erro ao carregar mensagens." }, { status: 500 });
  }
}

/** POST: usuário logado envia mensagem para o suporte. */
export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const userId = token.id as string;
  try {
    const body = await request.json();
    const { content } = body;
    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Mensagem é obrigatória." }, { status: 400 });
    }
    await connectDB();
    await SupportMessage.create({
      userId: new mongoose.Types.ObjectId(userId),
      sender: "user",
      content: content.trim().slice(0, 2000),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao enviar mensagem suporte:", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
