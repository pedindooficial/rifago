import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rotasProtegidas = ["/dashboard", "/campanhas", "/configuracao", "/apoiadores", "/afiliados", "/suporte", "/curso", "/tabela-taxas"];

function isProtegida(pathname: string): boolean {
  return rotasProtegidas.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtegida(pathname)) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/campanhas/:path*", "/configuracao/:path*", "/apoiadores/:path*", "/afiliados/:path*", "/suporte/:path*", "/curso/:path*", "/tabela-taxas/:path*"],
};
