import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session";

/**
 * Primeira barreira das áreas administrativas (verificação de assinatura do token).
 * A verificação completa (usuário ativo, sessão não revogada, papel) acontece no servidor
 * em cada página (requirePageUser) e em cada rota de API (requireApiUser).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value).catch(() => null);

  if (pathname.startsWith("/api/admin")) {
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    return NextResponse.next();
  }

  if (!session && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (session && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
