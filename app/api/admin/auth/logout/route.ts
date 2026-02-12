import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroyAdminSession, getAdminCookieOpts } from "@/lib/admin-auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token")?.value;
    if (token) await destroyAdminSession(token);
    const opts = getAdminCookieOpts();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(opts.name, "", { path: opts.path, maxAge: 0 });
    return res;
  } catch (error) {
    console.error("Erro no logout admin:", error);
    return NextResponse.json({ error: "Erro ao sair." }, { status: 500 });
  }
}
