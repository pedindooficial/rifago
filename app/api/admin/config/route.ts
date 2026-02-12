import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import AdminConfig from "@/lib/models/AdminConfig";

export async function GET() {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    await connectDB();
    let config = await AdminConfig.findOne().lean();
    if (!config) {
      await AdminConfig.create({ registrationOpen: false, whatsappUrl: "" });
      config = (await AdminConfig.findOne().lean()) as { whatsappUrl?: string; registrationOpen?: boolean } | null;
    }
    const c = config as { whatsappUrl?: string; registrationOpen?: boolean };
    return NextResponse.json({
      whatsappUrl: c?.whatsappUrl ?? "",
      registrationOpen: c?.registrationOpen ?? false,
    });
  } catch (error) {
    console.error("Erro ao obter config admin:", error);
    return NextResponse.json({ error: "Erro ao carregar configurações." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { whatsappUrl, registrationOpen } = body;
    await connectDB();
    await AdminConfig.findOneAndUpdate(
      {},
      {
        $set: {
          ...(typeof whatsappUrl === "string" && { whatsappUrl: whatsappUrl.trim() }),
          ...(typeof registrationOpen === "boolean" && { registrationOpen }),
        },
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao atualizar config admin:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações." }, { status: 500 });
  }
}
