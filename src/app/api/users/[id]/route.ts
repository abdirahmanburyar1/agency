import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.USERS_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Admin users cannot be edited
  if (target.role.name.toLowerCase() === "admin") {
    return NextResponse.json(
      { error: "Admin users cannot be edited" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, roleId, isActive, password, userType } = body;

    const data: { name?: string | null; roleId?: string; isActive?: boolean; userType?: string | null; passwordHash?: string } = {};
    if (name !== undefined) data.name = name?.trim() || null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (userType !== undefined) {
      data.userType =
        userType == null || userType === "" ? null : String(userType).toLowerCase() === "leader" ? "leader" : "officer";
    }
    if (roleId !== undefined) {
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      if (role.name.toLowerCase() === "admin") {
        return NextResponse.json(
          { error: "Cannot assign Admin role to users" },
          { status: 400 }
        );
      }
      data.roleId = roleId;
    }
    if (password && String(password).length >= 8) {
      data.passwordHash = await bcrypt.hash(String(password), 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
