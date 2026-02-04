import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");
  const isSetupPage = req.nextUrl.pathname.startsWith("/setup");

  if (isLoginPage || isSetupPage) {
    if (isLoggedIn && !isSetupPage) {
      const perms = (token?.permissions as string[] | undefined) ?? [];
      const hasLeader = perms.includes("haj_umrah.leader");
      const hasView = perms.includes("haj_umrah.view");
      if (hasLeader && !hasView) {
        return NextResponse.redirect(new URL("/leader", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const pathname = req.nextUrl.pathname;
  if (pathname === "/") {
    const perms = (token?.permissions as string[] | undefined) ?? [];
    const hasLeader = perms.includes("haj_umrah.leader");
    const hasView = perms.includes("haj_umrah.view");
    if (hasLeader && !hasView) {
      return NextResponse.redirect(new URL("/leader", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Exclude ALL /api routes - SessionProvider fetches /api/auth/session;
  // if middleware ran on it, unauthenticated users would get redirected to login HTML instead of JSON
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
