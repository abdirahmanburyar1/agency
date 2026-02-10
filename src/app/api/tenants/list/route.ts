import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Public: returns active tenants for login dropdown (no auth required) */
export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, subdomain: true, name: true },
    });
    return NextResponse.json(tenants);
  } catch (e) {
    console.error("Tenants list error:", e);
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}
