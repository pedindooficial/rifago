import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
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
    const password = typeof body.password === "string" ? body.password : "";
    if (code.length !== 6) {
      return NextResponse.json({ error: "Código 2FA deve ter 6 dígitos" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Informe sua senha" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(token.id).select("+password +twoFactorSecret").lean();
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const u = user as { password: string; twoFactorSecret?: string };
    const passwordOk = await bcrypt.compare(password, u.password);
    if (!passwordOk) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 400 });
    }

    if (!u.twoFactorSecret) {
      return NextResponse.json({ error: "2FA não está ativo" }, { status: 400 });
    }

    const valid = await totpVerify(u.twoFactorSecret, code);
    if (!valid) {
      return NextResponse.json({ error: "Código 2FA inválido ou expirado." }, { status: 400 });
    }

    await User.updateOne(
      { _id: token.id },
      { $unset: { twoFactorSecret: "" }, $set: { twoFactorEnabled: false } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao desativar 2FA:", error);
    return NextResponse.json({ error: "Erro ao desativar 2FA" }, { status: 500 });
  }
}
