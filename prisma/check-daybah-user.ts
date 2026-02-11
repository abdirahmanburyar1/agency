import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkUser() {
  console.log("Checking admin@daybah.com...\n");

  const users = await prisma.user.findMany({
    where: {
      email: "admin@daybah.com",
    },
    include: {
      role: true,
    },
  });

  if (users.length === 0) {
    console.log("❌ No users found with email admin@daybah.com");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);

  for (const user of users) {
    console.log("User Details:");
    console.log("- ID:", user.id);
    console.log("- Email:", user.email);
    console.log("- Name:", user.name);
    console.log("- Tenant ID:", user.tenantId);
    console.log("- Is Active:", user.isActive);
    console.log("- Is Platform Admin:", user.isPlatformAdmin);
    console.log("- Role:", user.role?.name || "NO ROLE");
    console.log("- Role ID:", user.roleId);

    // Test password
    const testPassword = "password";
    const match = await bcrypt.compare(testPassword, user.passwordHash);
    console.log(`- Password "${testPassword}" matches:`, match ? "✅ YES" : "❌ NO");
    console.log("");
  }

  await prisma.$disconnect();
}

checkUser().catch(console.error);
