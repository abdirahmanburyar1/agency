import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const perms = (session.user as { permissions?: string[] }).permissions ?? [];
  const isAdmin = (session.user as { roleName?: string }).roleName === "Admin";
  if (!isAdmin && !perms.includes(PERMISSION.ROLES_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });
  return NextResponse.json(permissions);
}
