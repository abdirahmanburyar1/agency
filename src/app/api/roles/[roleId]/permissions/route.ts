import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  await requirePermission(PERMISSION.ROLES_EDIT);
  const { roleId } = await params;

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  if (role.name === "Admin") {
    return NextResponse.json(
      { error: "Cannot modify Admin role permissions" },
      { status: 400 }
    );
  }

  const { permissionCodes } = await request.json();
  if (!Array.isArray(permissionCodes)) {
    return NextResponse.json(
      { error: "permissionCodes must be an array" },
      { status: 400 }
    );
  }

  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
  });
  const permIds = permissions.map((p) => p.id);

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    ...permIds.map((permId) =>
      prisma.rolePermission.create({
        data: { roleId, permissionId: permId },
      })
    ),
  ]);

  return NextResponse.json({ success: true });
}
