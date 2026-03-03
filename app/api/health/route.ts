import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

/**
 * GET /api/health - Verifica se a API e o banco de dados estão ok.
 * Use para conferir se a Vercel está conectando no MongoDB.
 */
export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { ok: false, database: "missing_uri", message: "MONGODB_URI não definida nas variáveis de ambiente." },
        { status: 503 }
      );
    }
    await connectDB();
    return NextResponse.json({
      ok: true,
      database: "connected",
      message: "API e banco de dados funcionando.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Health check falhou:", message);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        message: "Falha ao conectar no banco. Verifique MONGODB_URI e o Network Access no MongoDB Atlas.",
        detail: message,
      },
      { status: 503 }
    );
  }
}
