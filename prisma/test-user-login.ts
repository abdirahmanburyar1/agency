import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testUserLogin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const tenantId = process.argv[4];

  if (!email || !password) {
    console.log("Usage: npx tsx prisma/test-user-login.ts <email> <password> [tenantId]");
    process.exit(1);
  }

  console.log("Testing login for:", email);
  console.log("Tenant ID:", tenantId || "default");

  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      tenantId: tenantId || null,
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.log("❌ User not found");
    console.log("\nSearching all users with this email:");
    const allUsers = await prisma.user.findMany({
      where: {
        email: email.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
        tenantId: true,
        isActive: true,
        isPlatformAdmin: true,
      },
    });
    console.log(allUsers);
    process.exit(1);
  }

  console.log("\n✅ User found:");
  console.log("- ID:", user.id);
  console.log("- Email:", user.email);
  console.log("- Name:", user.name);
  console.log("- Tenant ID:", user.tenantId);
  console.log("- Is Active:", user.isActive);
  console.log("- Is Platform Admin:", user.isPlatformAdmin);
  console.log("- Role:", user.role?.name);

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  console.log("\nPassword match:", passwordMatch ? "✅ YES" : "❌ NO");

  if (!passwordMatch) {
    console.log("\n❌ Password does not match!");
    console.log("Password hash in DB:", user.passwordHash.substring(0, 20) + "...");
  } else {
    console.log("\n✅ Login would succeed!");
  }

  await prisma.$disconnect();
}

testUserLogin().catch(console.error);
