import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import BrandingConfig from "@/lib/models/BrandingConfig";

type BrandingPayload = {
  siteTitle?: string;
  logoUrl?: string;
  faviconUrl?: string;
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
    return NextResponse.json<BrandingPayload>({
      siteTitle: "",
      logoUrl: "",
      faviconUrl: "",
    });
  }

  const c = cfg as unknown as BrandingPayload;
  return NextResponse.json<BrandingPayload>({
    siteTitle: c.siteTitle ?? "",
    logoUrl: c.logoUrl ?? "",
    faviconUrl: c.faviconUrl ?? "",
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

  const update: BrandingPayload = {};
  if (typeof body.siteTitle === "string") {
    update.siteTitle = body.siteTitle.trim();
  }
  if (typeof body.logoUrl === "string") {
    update.logoUrl = body.logoUrl.trim();
  }
  if (typeof body.faviconUrl === "string") {
    update.faviconUrl = body.faviconUrl.trim();
  }

  await BrandingConfig.findOneAndUpdate(
    { userId: token.id },
    { $set: update },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}

