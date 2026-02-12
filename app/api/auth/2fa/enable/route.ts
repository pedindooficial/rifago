import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { totpVerify } from "@/lib/totp";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
    if (code.length !== 6) {
      return NextResponse.json({ error: "Código deve ter 6 dígitos" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(token.id).select("+twoFactorSecret").lean();
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const u = user as { twoFactorSecret?: string };
    if (!u.twoFactorSecret) {
      return NextResponse.json({ error: "Execute o passo de configuração (QR Code) primeiro." }, { status: 400 });
    }

    const valid = await totpVerify(u.twoFactorSecret, code);
    if (!valid) {
      return NextResponse.json({ error: "Código inválido ou expirado. Tente novamente." }, { status: 400 });
    }

    await User.updateOne({ _id: token.id }, { $set: { twoFactorEnabled: true } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao ativar 2FA:", error);
    return NextResponse.json({ error: "Erro ao ativar 2FA" }, { status: 500 });
  }
}
