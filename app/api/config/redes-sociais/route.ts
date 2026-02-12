import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import RedesSociaisConfig from "@/lib/models/RedesSociaisConfig";

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error("NEXTAUTH_SECRET não definido para a API de redes sociais");
}

function normalizeUrl(value: string | undefined): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function normalizeWhatsApp(value: string | undefined): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim().replace(/\D/g, "");
  if (!trimmed) return "";
  if (/^\d+$/.test(trimmed)) return `https://wa.me/${trimmed}`;
  return normalizeUrl(value);
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: JWT_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await connectDB();
  const cfg = await RedesSociaisConfig.findOne({ userId: token.id }).lean();

  if (!cfg) {
    return NextResponse.json({
      facebook: "",
      instagram: "",
      twitter: "",
      whatsapp: "",
      whatsappGrupo: "",
      youtube: "",
      tiktok: "",
      linkedin: "",
    });
  }

  const c = cfg as {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
    whatsappGrupo?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };

  return NextResponse.json({
    facebook: c.facebook ?? "",
    instagram: c.instagram ?? "",
    twitter: c.twitter ?? "",
    whatsapp: c.whatsapp ?? "",
    whatsappGrupo: c.whatsappGrupo ?? "",
    youtube: c.youtube ?? "",
    tiktok: c.tiktok ?? "",
    linkedin: c.linkedin ?? "",
  });
}

export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request, secret: JWT_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
    whatsappGrupo?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };

  await connectDB();

  // Só atualiza campos que vieram no body, para não sobrescrever com vazio se o cliente não enviar algum campo
  const update: Record<string, string> = {};
  const keys = [
    "facebook",
    "instagram",
    "twitter",
    "whatsapp",
    "whatsappGrupo",
    "youtube",
    "tiktok",
    "linkedin",
  ] as const;
  for (const key of keys) {
    if (key in body) {
      const value = body[key];
      if (key === "whatsapp") {
        update[key] = normalizeWhatsApp(value);
      } else {
        update[key] = normalizeUrl(value);
      }
    }
  }

  await RedesSociaisConfig.findOneAndUpdate(
    { userId: token.id },
    { $set: update },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}
