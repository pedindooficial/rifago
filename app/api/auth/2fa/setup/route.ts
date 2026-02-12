import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { totpGenerateSecret, totpGenerateURI } from "@/lib/totp";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id || !token?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(token.id).select("+twoFactorSecret twoFactorEnabled email").lean();
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const u = user as unknown as { _id: unknown; email: string; twoFactorEnabled?: boolean };
    if (u.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA já está ativo. Desative primeiro para reconfigurar." }, { status: 400 });
    }

    const secret = totpGenerateSecret();
    const uri = totpGenerateURI(secret, u.email);

    await User.updateOne(
      { _id: token.id },
      { $set: { twoFactorSecret: secret, twoFactorEnabled: false } }
    );

    const qrCodeDataUrl = await QRCode.toDataURL(uri, { width: 220, margin: 2 });

    return NextResponse.json({ secret, qrCodeDataUrl });
  } catch (error) {
    console.error("Erro ao configurar 2FA:", error);
    return NextResponse.json({ error: "Erro ao configurar 2FA" }, { status: 500 });
  }
}
