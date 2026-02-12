import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    await connectDB();
    const users = await User.find({})
      .select("email name createdAt twoFactorEnabled")
      .sort({ createdAt: -1 })
      .lean();
    const list = users.map((u) => {
      const doc = u as { _id: { toString: () => string }; email: string; name: string; createdAt: Date; twoFactorEnabled?: boolean };
      return {
        id: doc._id.toString(),
        email: doc.email,
        name: doc.name,
        createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
        twoFactorEnabled: doc.twoFactorEnabled ?? false,
      };
    });
    return NextResponse.json({ users: list });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json({ error: "Erro ao carregar usuários." }, { status: 500 });
  }
}
