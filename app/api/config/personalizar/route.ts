import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import BrandingConfig from "@/lib/models/BrandingConfig";

type BrandingPayload = {
  siteTitle?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  ctaButtonText?: string;
  slogan?: string;
  footerText?: string;
};

const emptyPayload: BrandingPayload = {
  siteTitle: "",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "",
  ctaButtonText: "",
  slogan: "",
  footerText: "",
};

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
  const cfg = await BrandingConfig.findOne({ userId: token.id }).lean();
  if (!cfg) {
    return NextResponse.json<BrandingPayload>(emptyPayload);
  }

  const c = cfg as unknown as BrandingPayload;
  return NextResponse.json<BrandingPayload>({
    siteTitle: c.siteTitle ?? "",
    logoUrl: c.logoUrl ?? "",
    faviconUrl: c.faviconUrl ?? "",
    primaryColor: c.primaryColor ?? "",
    ctaButtonText: c.ctaButtonText ?? "",
    slogan: c.slogan ?? "",
    footerText: c.footerText ?? "",
  });
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

  const body = (await request.json()) as BrandingPayload;
  await connectDB();

  const update: Record<string, string> = {};
  const keys: (keyof BrandingPayload)[] = ["siteTitle", "logoUrl", "faviconUrl", "primaryColor", "ctaButtonText", "slogan", "footerText"];
  for (const key of keys) {
    if (key in body && typeof body[key] === "string") {
      update[key] = (body[key] as string).trim();
    }
  }

  await BrandingConfig.findOneAndUpdate(
    { userId: token.id },
    { $set: update },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}

