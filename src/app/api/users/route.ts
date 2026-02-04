import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.USERS_CREATE);
  } catch (e) {
    const res = (await import("@/lib/api-auth")).handleAuthError(e);
    if (res) return res;
    throw e;
  }

  try {
    const { email, password, name, roleId, userType } = await request.json();
    if (!email || !password || !roleId) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }
    const normalizedUserType =
      userType != null && userType !== ""
        ? (String(userType).toLowerCase() === "leader" ? "leader" : "officer")
        : null;

    const existing = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    await prisma.user.create({
      data: {
        email: String(email).toLowerCase(),
        passwordHash,
        name: name || null,
        roleId,
        userType: normalizedUserType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Users POST error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
