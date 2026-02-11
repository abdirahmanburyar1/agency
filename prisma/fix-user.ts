import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUser() {
  const email = process.argv[2];
  const tenantId = process.argv[3];

  if (!email || !tenantId) {
    console.log("Usage: npx tsx prisma/fix-user.ts <email> <tenantId>");
    process.exit(1);
  }

  // Update user to remove platform admin flag
  const user = await prisma.user.updateMany({
    where: {
      email: email.toLowerCase(),
      tenantId,
    },
    data: {
      isPlatformAdmin: false,
    },
  });

  console.log(`✅ Fixed ${user.count} user(s)`);
  console.log(`User ${email} can now login at the tenant subdomain!`);

  await prisma.$disconnect();
}

fixUser().catch(console.error);
