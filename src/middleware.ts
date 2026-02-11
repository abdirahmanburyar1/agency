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
  const isPlatformAdmin = (token as { isPlatformAdmin?: boolean })?.isPlatformAdmin;
  const onSubdomain = isOnSubdomain(req.nextUrl.hostname);
  
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");
  const isSetupPage = req.nextUrl.pathname.startsWith("/setup");
  const isTrackPage = req.nextUrl.pathname.startsWith("/track");
  const isPlatformPage = req.nextUrl.pathname.startsWith("/platform");
  const isTenantSuspendedPage = req.nextUrl.pathname.startsWith("/tenant-suspended");

  // Public pages - allow through but redirect if logged in
  if (isLoginPage || isSetupPage || isTrackPage || isTenantSuspendedPage) {
    if (isLoggedIn && !isSetupPage && !isTrackPage && !isTenantSuspendedPage) {
      // Logged-in users on login page: redirect to platform or app based on admin status
      if (!onSubdomain && isPlatformAdmin) {
        return NextResponse.redirect(new URL("/platform", req.url));
      }
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

  // Platform pages - only accessible on root domain by platform admins
  if (isPlatformPage) {
    if (!isLoggedIn || !isPlatformAdmin) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // If trying to access /platform on a subdomain, redirect to root domain
    if (onSubdomain) {
      return NextResponse.redirect(new URL(`${rootUrl(req)}/platform`, req.url));
    }
    return NextResponse.next();
  }

  // Root domain without /platform path = redirect based on user type
  if (!onSubdomain && req.nextUrl.pathname !== "/" && !isLoginPage) {
    // Regular app pages on root domain: only platform admins can access
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (!isPlatformAdmin) {
      // Non-platform admins should use their tenant subdomain
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Root domain homepage: redirect platform admins to /platform
  if (!onSubdomain && req.nextUrl.pathname === "/") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isPlatformAdmin) {
      return NextResponse.redirect(new URL("/platform", req.url));
    }
    // Non-platform admins on root domain homepage: redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // All other pages require login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Subdomain app pages: handle role-based redirects
  const pathname = req.nextUrl.pathname;
  if (pathname === "/" && onSubdomain) {
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
