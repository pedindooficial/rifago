import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Campanha from "@/lib/models/Campanha";
import Compra from "@/lib/models/Compra";
import RedesSociaisConfig from "@/lib/models/RedesSociaisConfig";
import BrandingConfig from "@/lib/models/BrandingConfig";
import { docToCampanha } from "@/lib/campanhas-db";

async function getStatsCampanha(campanhaId: string): Promise<{
  titulosVendidos: number;
  valorArrecadado: number;
  titulosPendentes: number;
}> {
  const [vendidos, pendentes] = await Promise.all([
    Compra.aggregate([
      { $match: { campanhaId: new mongoose.Types.ObjectId(campanhaId), status: { $in: ["paga", "simulada"] } } },
      { $group: { _id: null, titulos: { $sum: "$quantidade" }, valor: { $sum: "$valorTotal" } } },
    ]).exec(),
    Compra.aggregate([
      { $match: { campanhaId: new mongoose.Types.ObjectId(campanhaId), status: "pendente" } },
      { $group: { _id: null, titulos: { $sum: "$quantidade" } } },
    ]).exec(),
  ]);
  return {
    titulosVendidos: vendidos[0]?.titulos ?? 0,
    valorArrecadado: Math.round((vendidos[0]?.valor ?? 0) * 100) / 100,
    titulosPendentes: pendentes[0]?.titulos ?? 0,
  };
}

/** GET: retorna campanha pública por ID — apenas se status === "ativa" (sem auth) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }
    await connectDB();
    const doc = await Campanha.findOne({
      _id: id,
      status: "ativa",
    })
      .lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Campanha não encontrada ou não está ativa" },
        { status: 404 }
      );
    }
    const campanha = docToCampanha(doc as unknown as Parameters<typeof docToCampanha>[0]);
    const stats = await getStatsCampanha(id);
    const docWithUserId = doc as unknown as { userId?: unknown };
    let redesSociais: Record<string, string> = {};
    let brandingLogoUrl = "";
    let brandingFaviconUrl = "";
    let brandingSiteTitle = "";
    let brandingPrimaryColor = "";
    let brandingCtaText = "";
    let brandingSlogan = "";
    let brandingFooterText = "";

    if (docWithUserId.userId) {
      const [redes, branding] = await Promise.all([
        RedesSociaisConfig.findOne({ userId: docWithUserId.userId }).lean(),
        BrandingConfig.findOne({ userId: docWithUserId.userId }).lean(),
      ]);

      if (redes) {
        const r = redes as Record<string, string | boolean | undefined>;
        ["facebook", "instagram", "twitter", "whatsapp", "whatsappGrupo", "youtube", "tiktok", "linkedin"].forEach((key) => {
          const v = r[key];
          const ativo = r[`${key}Ativo`];
          if (v && String(v).trim() !== "" && ativo !== false) {
            redesSociais[key] = String(v).trim();
          }
        });
      }

      if (branding) {
        const b = branding as unknown as {
          logoUrl?: string;
          faviconUrl?: string;
          siteTitle?: string;
          primaryColor?: string;
          ctaButtonText?: string;
          slogan?: string;
          footerText?: string;
        };
        brandingLogoUrl = b.logoUrl?.trim() || "";
        brandingFaviconUrl = b.faviconUrl?.trim() || "";
        brandingSiteTitle = b.siteTitle?.trim() || "";
        brandingPrimaryColor = b.primaryColor?.trim() || "";
        brandingCtaText = b.ctaButtonText?.trim() || "";
        brandingSlogan = b.slogan?.trim() || "";
        brandingFooterText = b.footerText?.trim() || "";
      }
    }

    return NextResponse.json({
      ...campanha,
      ...stats,
      redesSociais,
      brandingLogoUrl: brandingLogoUrl || undefined,
      brandingFaviconUrl: brandingFaviconUrl || undefined,
      brandingSiteTitle: brandingSiteTitle || undefined,
      brandingPrimaryColor: brandingPrimaryColor || undefined,
      brandingCtaText: brandingCtaText || undefined,
      brandingSlogan: brandingSlogan || undefined,
      brandingFooterText: brandingFooterText || undefined,
    });
  } catch (error) {
    console.error("Erro ao obter campanha pública:", error);
    return NextResponse.json(
      { error: "Erro ao obter campanha" },
      { status: 500 }
    );
  }
}
