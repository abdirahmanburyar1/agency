import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getTenantIdFromSession } from "@/lib/tenant";
import { requirePermission, PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

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

  const tenantId = getTenantIdFromSession(session);
  const roles = await prisma.role.findMany({
    where: {
      tenantId, // SCOPE BY TENANT
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(roles);
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.ROLES_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }

  const session = await auth();
  const tenantId = getTenantIdFromSession(session);
  const { name, description } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Role name is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId, name: name.trim() } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Role with this name already exists" },
      { status: 400 }
    );
  }

  const role = await prisma.role.create({
    data: {
      tenantId,
      name: name.trim(),
      description: description?.trim() || null,
    },
  });
  return NextResponse.json(role);
}
