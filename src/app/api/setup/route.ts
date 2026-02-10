import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

// Only allow when no users exist
export async function POST(request: Request) {
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      return NextResponse.json(
        { error: "Admin already exists. Use login." },
        { status: 400 }
      );
    }

    const { email, password, name, roleId } = await request.json();
    if (!email || !password || !roleId) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    const emailLower = String(email).toLowerCase();
    const existing = await prisma.user.findFirst({
      where: { email: emailLower },
    });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    await prisma.user.create({
      data: {
        email: emailLower,
        passwordHash,
        name: name ?? "Admin",
        roleId,
        tenantId: DEFAULT_TENANT_ID,
        isPlatformAdmin: true, // First admin can manage tenants
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}
