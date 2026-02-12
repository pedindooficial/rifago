import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import AdminConfig from "@/lib/models/AdminConfig";
import { createAdminSession, getAdminCookieOpts } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }
    await connectDB();

    let config: { registrationOpen?: boolean } | null = (await AdminConfig.findOne().lean()) as { registrationOpen?: boolean } | null;
    if (!config) {
      await AdminConfig.create({ registrationOpen: true });
      config = (await AdminConfig.findOne().lean()) as { registrationOpen?: boolean } | null;
    }
    const regOpen = config?.registrationOpen ?? true;
    const hasAdmin = (await Admin.countDocuments()) > 0;
    if (!regOpen && hasAdmin) {
      return NextResponse.json(
        { error: "Cadastro de administrador está desativado." },
        { status: 403 }
      );
    }

    const existingEmail = await Admin.findOne({ email: email.trim().toLowerCase() }).lean();
    if (existingEmail) {
      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 409 });
    }

    const created = await Admin.create({
      email: email.trim().toLowerCase(),
      password,
    });
    const adminId = (created as unknown as { _id: { toString: () => string } })._id.toString();

    if (!hasAdmin) {
      await AdminConfig.findOneAndUpdate({}, { $set: { registrationOpen: false } }, { upsert: true });
    }

    const token = await createAdminSession(adminId);
    const opts = getAdminCookieOpts();
    const res = NextResponse.json({ ok: true, message: "Administrador cadastrado com sucesso." });
    res.cookies.set(opts.name, token, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });
    return res;
  } catch (error) {
    console.error("Erro ao registrar admin:", error);
    return NextResponse.json({ error: "Erro ao criar administrador." }, { status: 500 });
  }
}
