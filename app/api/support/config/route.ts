import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AdminConfig from "@/lib/models/AdminConfig";

/** GET: público - retorna o link/número do WhatsApp para o botão de suporte. */
export async function GET() {
  try {
    await connectDB();
    const config = await AdminConfig.findOne().select("whatsappUrl").lean();
    const url = (config as { whatsappUrl?: string } | null)?.whatsappUrl ?? "";
    return NextResponse.json({ whatsappUrl: url });
  } catch (error) {
    console.error("Erro ao obter config suporte:", error);
    return NextResponse.json({ whatsappUrl: "" }, { status: 200 });
  }
}
