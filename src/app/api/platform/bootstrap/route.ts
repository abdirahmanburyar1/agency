import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * One-time bootstrap: promote the first user to platform admin.
 * Call once after multi-tenant migration if no platform admin exists yet.
 * Requires X-Bootstrap-Secret header matching PLATFORM_BOOTSTRAP_SECRET (optional in dev).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.PLATFORM_BOOTSTRAP_SECRET;
  if (secret && request.headers.get("x-bootstrap-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const platformAdminCount = await prisma.user.count({
      where: { isPlatformAdmin: true },
    });
    if (platformAdminCount > 0) {
      return NextResponse.json({ message: "Platform admin already exists" });
    }
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!firstUser) {
      return NextResponse.json({ error: "No users found" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: firstUser.id },
      data: { isPlatformAdmin: true },
    });
    return NextResponse.json({ success: true, message: "First user promoted to platform admin" });
  } catch (e) {
    console.error("Platform bootstrap error:", e);
    return NextResponse.json({ error: "Bootstrap failed" }, { status: 500 });
  }
}
