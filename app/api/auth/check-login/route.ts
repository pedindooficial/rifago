import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Login2FAToken from "@/lib/models/Login2FAToken";

const TOKEN_EXPIRY_MS = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email }).select("+password twoFactorEnabled").lean();
    if (!user) {
      return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
    }

    const u = user as unknown as { _id: unknown; email: string; name: string; password: string; twoFactorEnabled?: boolean };
    const passwordOk = await bcrypt.compare(password, u.password);
    if (!passwordOk) {
      return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
    }

    if (!u.twoFactorEnabled) {
      return NextResponse.json({ requires2FA: false });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await Login2FAToken.create({
      userId: u._id,
      token,
      expiresAt,
    });

    return NextResponse.json({
      requires2FA: true,
      token,
      email: u.email,
    });
  } catch (error) {
    console.error("Erro ao verificar login:", error);
    return NextResponse.json({ error: "Erro ao verificar credenciais" }, { status: 500 });
  }
}
