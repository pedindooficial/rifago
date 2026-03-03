import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import RedesSociaisConfig from "@/lib/models/RedesSociaisConfig";

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
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "NEXTAUTH_SECRET não configurado" },
      { status: 500 }
    );
  }
  const token = await getToken({ req: request, secret });
  if (!token?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await connectDB();
  const cfg = await RedesSociaisConfig.findOne({ userId: token.id }).lean();

  if (!cfg) {
    const base = { facebook: "", instagram: "", twitter: "", whatsapp: "", whatsappGrupo: "", youtube: "", tiktok: "", linkedin: "" };
    const ativos = ["facebook", "instagram", "twitter", "whatsapp", "whatsappGrupo", "youtube", "tiktok", "linkedin"].reduce(
      (acc, k) => ({ ...acc, [`${k}Ativo`]: true }),
      {} as Record<string, boolean>
    );
    return NextResponse.json({ ...base, ...ativos });
  }

  const c = cfg as unknown as Record<string, string | boolean | undefined>;
  const out: Record<string, string | boolean> = {
    facebook: (c.facebook as string) ?? "",
    instagram: (c.instagram as string) ?? "",
    twitter: (c.twitter as string) ?? "",
    whatsapp: (c.whatsapp as string) ?? "",
    whatsappGrupo: (c.whatsappGrupo as string) ?? "",
    youtube: (c.youtube as string) ?? "",
    tiktok: (c.tiktok as string) ?? "",
    linkedin: (c.linkedin as string) ?? "",
  };
  ["facebook", "instagram", "twitter", "whatsapp", "whatsappGrupo", "youtube", "tiktok", "linkedin"].forEach((k) => {
    out[`${k}Ativo`] = c[`${k}Ativo`] !== false;
  });
  return NextResponse.json(out);
}

export async function PUT(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "NEXTAUTH_SECRET não configurado" },
      { status: 500 }
    );
  }
  const token = await getToken({ req: request, secret });
  if (!token?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, string | boolean | undefined>;

  await connectDB();

  const update: Record<string, string | boolean> = {};
  const urlKeys = ["facebook", "instagram", "twitter", "whatsapp", "whatsappGrupo", "youtube", "tiktok", "linkedin"] as const;
  for (const key of urlKeys) {
    if (key in body) {
      const value = body[key];
      if (typeof value === "string") {
        update[key] = key === "whatsapp" ? normalizeWhatsApp(value) : normalizeUrl(value);
      }
    }
  }
  urlKeys.forEach((k) => {
    const ativoKey = `${k}Ativo`;
    if (ativoKey in body && typeof body[ativoKey] === "boolean") {
      update[ativoKey] = body[ativoKey];
    }
  });

  await RedesSociaisConfig.findOneAndUpdate(
    { userId: token.id },
    { $set: update },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}
