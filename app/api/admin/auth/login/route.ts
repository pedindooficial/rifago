import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import { createAdminSession, getAdminCookieOpts } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }
    await connectDB();
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select("+password").lean();
    if (!admin) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, (admin as { password: string }).password);
    if (!ok) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }
    const a = admin as { _id: { toString: () => string } };
    const token = await createAdminSession(a._id.toString());
    const opts = getAdminCookieOpts();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(opts.name, token, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });
    return res;
  } catch (error) {
    console.error("Erro no login admin:", error);
    return NextResponse.json({ error: "Erro ao fazer login." }, { status: 500 });
  }
}
