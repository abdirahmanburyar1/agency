import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "fayohealthtech.so";

/** True if hostname has a tenant subdomain (e.g. daybah.fayohealthtech.so or daybah.localhost) */
function isOnSubdomain(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/:\d+$/, "");
  const parts = host.split(".");
  if (parts.length < 2) return false;
  // daybah.localhost = subdomain; localhost = root
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0] !== "www" && parts[0] !== "app" && parts[0] !== "api";
  }
  if (parts.length === 2) return false; // e.g. fayohealthtech.so
  const first = parts[0];
  if (first === "www" || first === "app" || first === "api") return false;
  return true;
}

/** Build root domain URL (for redirects) */
function rootUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${ROOT_DOMAIN}`;
}

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");
  const isSetupPage = req.nextUrl.pathname.startsWith("/setup");
  const isTrackPage = req.nextUrl.pathname.startsWith("/track");
  const isPlatformPage = req.nextUrl.pathname.startsWith("/platform");
  const isTenantSuspendedPage = req.nextUrl.pathname.startsWith("/tenant-suspended");

  if (isLoginPage || isSetupPage || isTrackPage || isTenantSuspendedPage) {
    if (isLoggedIn && !isSetupPage && !isTrackPage && !isTenantSuspendedPage) {
      const perms = (token?.permissions as string[] | undefined) ?? [];
      const roleName = String((token?.roleName as string) ?? "").trim().toLowerCase();
      const hasLeader = perms.includes("haj_umrah.leader");
      const hasView = perms.includes("haj_umrah.view");
      if (hasLeader && !hasView) {
        return NextResponse.redirect(new URL("/leader", req.url));
      }
      if (roleName === "cargo section") {
        return NextResponse.redirect(new URL("/cargo", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (isPlatformPage) {
    const isPlatformAdmin = (token as { isPlatformAdmin?: boolean })?.isPlatformAdmin;
    if (!isLoggedIn || !isPlatformAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Platform admin lives at root domain only; redirect subdomain to root
    const hostname = req.nextUrl.hostname || new URL(req.url).hostname;
    if (isOnSubdomain(hostname)) {
      return NextResponse.redirect(new URL(req.nextUrl.pathname, rootUrl(req)));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Root domain = platform admin only. Tenant app lives on subdomains (e.g. daybah.fayohealthtech.so).
  const hostname = req.nextUrl.hostname || new URL(req.url).hostname;
  if (!isOnSubdomain(hostname)) {
    const isPlatformAdmin = (token as { isPlatformAdmin?: boolean })?.isPlatformAdmin;
    if (isPlatformAdmin && req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/platform", rootUrl(req)));
    }
    // Non-platform-admin or app routes: redirect to Daybah subdomain
    const daybahBase = hostname === "localhost"
      ? `${req.nextUrl.protocol}//daybah.${req.nextUrl.host}`
      : `https://daybah.${ROOT_DOMAIN}`;
    return NextResponse.redirect(new URL(req.nextUrl.pathname + req.nextUrl.search, daybahBase));
  }

  const pathname = req.nextUrl.pathname;
  if (pathname === "/") {
    const perms = (token?.permissions as string[] | undefined) ?? [];
    const roleName = String((token?.roleName as string) ?? "").trim().toLowerCase();
    const hasLeader = perms.includes("haj_umrah.leader");
    const hasView = perms.includes("haj_umrah.view");
    if (hasLeader && !hasView) {
      return NextResponse.redirect(new URL("/leader", req.url));
    }
    if (roleName === "cargo section") {
      return NextResponse.redirect(new URL("/cargo", req.url));
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
