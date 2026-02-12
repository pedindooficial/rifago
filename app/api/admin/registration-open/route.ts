import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import AdminConfig from "@/lib/models/AdminConfig";

/** GET: público - indica se a página de cadastro de admin está disponível. */
export async function GET() {
  try {
    await connectDB();
    const hasAdmin = (await Admin.countDocuments()) > 0;
    let config = await AdminConfig.findOne().lean();
    if (!config) {
      await AdminConfig.create({ registrationOpen: true });
      config = (await AdminConfig.findOne().lean()) as { registrationOpen?: boolean } | null;
    }
    const registrationOpen =
      ((config as { registrationOpen?: boolean })?.registrationOpen ?? true) && !hasAdmin;
    return NextResponse.json({
      registrationOpen: !!registrationOpen,
      hasAdmin,
      canRegister: (config as { registrationOpen?: boolean })?.registrationOpen === true,
    });
  } catch (error) {
    console.error("Erro ao verificar registro admin:", error);
    return NextResponse.json(
      { registrationOpen: false, hasAdmin: false, canRegister: false },
      { status: 200 }
    );
  }
}
