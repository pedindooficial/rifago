import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email?.trim() || !name?.trim() || !password) {
      return NextResponse.json(
        { error: "Preencha email, nome e senha." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409 }
      );
    }

    await User.create({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password,
    });

    return NextResponse.json({ ok: true, message: "Conta criada com sucesso." });
  } catch (error) {
    console.error("Erro ao registrar:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}
