import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSubdomain } from "@/lib/tenant";
import * as bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  const url = new URL(req.url);
  const hostname = url.hostname;
  const subdomain = parseSubdomain(hostname);

  const debug: any = {
    hostname,
    subdomain,
    email: email?.toLowerCase(),
  };

  // Find tenant
  if (subdomain) {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
    });
    debug.tenant = tenant
      ? {
          id: tenant.id,
          subdomain: tenant.subdomain,
          name: tenant.name,
          status: tenant.status,
        }
      : null;
  }

  // Find user with this email and tenant
  const tenantId = debug.tenant?.id || null;
  const users = await prisma.user.findMany({
    where: {
      email: email?.toLowerCase(),
    },
    select: {
      id: true,
      email: true,
      tenantId: true,
      isActive: true,
      isPlatformAdmin: true,
      passwordHash: true,
    },
  });

  debug.allUsersWithEmail = users.map((u) => ({
    id: u.id,
    email: u.email,
    tenantId: u.tenantId,
    isActive: u.isActive,
    isPlatformAdmin: u.isPlatformAdmin,
  }));

  // Check specific user
  const user = users.find((u) => u.tenantId === tenantId);
  debug.matchingUser = user
    ? {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        isActive: user.isActive,
        isPlatformAdmin: user.isPlatformAdmin,
      }
    : null;

  if (user && password) {
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    debug.passwordMatch = passwordMatch;
  }

  return NextResponse.json(debug);
}
