import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(token.id).select("twoFactorEnabled").lean();
    if (!user) {
      return NextResponse.json({ enabled: false });
    }

    const u = user as { twoFactorEnabled?: boolean };
    return NextResponse.json({ enabled: !!u.twoFactorEnabled });
  } catch (error) {
    console.error("Erro ao verificar status 2FA:", error);
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}
