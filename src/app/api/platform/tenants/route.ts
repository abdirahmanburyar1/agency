import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/platform";

export async function GET() {
  const err = await requirePlatformAdmin();
  if (err) return err;
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
      },
    });
    return NextResponse.json(tenants);
  } catch (e) {
    console.error("Platform tenants GET error:", e);
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const err = await requirePlatformAdmin();
  if (err) return err;
  try {
    const body = await request.json();
    const subdomain = String(body.subdomain ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    const name = String(body.name ?? "").trim();
    if (!subdomain || !name) {
      return NextResponse.json({ error: "Subdomain and name are required" }, { status: 400 });
    }
    const existing = await prisma.tenant.findUnique({ where: { subdomain } });
    if (existing) {
      return NextResponse.json({ error: "Subdomain already in use" }, { status: 400 });
    }
    const tenant = await prisma.tenant.create({
      data: { subdomain, name, status: "active" },
    });
    return NextResponse.json(tenant);
  } catch (e) {
    console.error("Platform tenants POST error:", e);
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}
