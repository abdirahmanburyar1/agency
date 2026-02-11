import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId } = await params;
  const body = await req.json();
  const { email, password, name } = body;

  // Validate input
  if (!email || !password || !name) {
    return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email,
      },
    },
  });

  if (existingUser) {
    return NextResponse.json({ error: "User with this email already exists for this tenant" }, { status: 400 });
  }

  // Get or create Admin role for this tenant
  let adminRole = await prisma.role.findUnique({
    where: {
      tenantId_name: {
        tenantId,
        name: "Admin",
      },
    },
  });

  // If Admin role doesn't exist, create it with all permissions
  if (!adminRole) {
    const allPermissions = await prisma.permission.findMany();
    
    adminRole = await prisma.role.create({
      data: {
        tenantId,
        name: "Admin",
        description: "Full system access",
        permissions: {
          create: allPermissions.map((perm) => ({
            permissionId: perm.id,
          })),
        },
      },
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      roleId: adminRole.id,
      tenantId,
      isActive: true,
    },
    include: {
      role: true,
      tenant: true,
    },
  });

  // Don't return password hash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return NextResponse.json(userWithoutPassword, { status: 201 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId } = await params;

  const users = await prisma.user.findMany({
    where: { tenantId },
    include: {
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Remove password hashes
  const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);

  return NextResponse.json(usersWithoutPasswords);
}
