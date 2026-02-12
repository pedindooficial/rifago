import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import SupportMessage from "@/lib/models/SupportMessage";
import User from "@/lib/models/User";

/** GET: lista de threads (usuários que têm mensagens) ou mensagens de um usuário. */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId) {
      const messages = await SupportMessage.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: 1 })
        .lean();
      const list = messages.map((m) => {
        const doc = m as unknown as { sender: string; content: string; createdAt: Date };
        return {
          sender: doc.sender,
          content: doc.content,
          createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
        };
      });
      return NextResponse.json({ messages: list });
    }

    const userIds = await SupportMessage.distinct("userId");
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id email name")
      .lean();
    const userMap = Object.fromEntries(
      users.map((u) => {
        const d = u as unknown as { _id: mongoose.Types.ObjectId; email: string; name: string };
        return [d._id.toString(), { email: d.email, name: d.name }];
      })
    );
    const threads: { userId: string; email: string; name: string; lastAt?: string }[] = [];
    for (const id of userIds) {
      const sid = id.toString();
      const last = await SupportMessage.findOne({ userId: id }).sort({ createdAt: -1 }).lean();
      const u = userMap[sid] as { email: string; name: string } | undefined;
      threads.push({
        userId: sid,
        email: u?.email ?? "",
        name: u?.name ?? "",
        lastAt: last ? ((last as unknown as { createdAt: Date }).createdAt instanceof Date ? (last as unknown as { createdAt: Date }).createdAt.toISOString() : String((last as unknown as { createdAt: unknown }).createdAt)) : undefined,
      });
    }
    threads.sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
    return NextResponse.json({ threads });
  } catch (error) {
    console.error("Erro ao listar chat admin:", error);
    return NextResponse.json({ error: "Erro ao carregar mensagens." }, { status: 500 });
  }
}

/** POST: admin envia mensagem para um usuário. */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { userId, content } = body;
    if (!userId || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "userId e content são obrigatórios." }, { status: 400 });
    }
    await connectDB();
    await SupportMessage.create({
      userId: new mongoose.Types.ObjectId(userId),
      sender: "admin",
      content: content.trim().slice(0, 2000),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao enviar mensagem admin:", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
