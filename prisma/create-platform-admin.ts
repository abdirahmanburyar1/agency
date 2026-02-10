import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = "cldefault00000000000000001";

async function main() {
  const email = "admin@buryar.com";
  const password = "password";

  const adminRole = await prisma.role.findFirst({
    where: { tenantId: DEFAULT_TENANT_ID, name: "Admin" },
  });
  if (!adminRole) {
    console.error("Admin role not found. Run db:seed first.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), tenantId: DEFAULT_TENANT_ID },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, isPlatformAdmin: true },
    });
    console.log(`Updated user ${email} as platform admin.`);
  } else {
    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: "Platform Admin",
        roleId: adminRole.id,
        tenantId: DEFAULT_TENANT_ID,
        isPlatformAdmin: true,
      },
    });
    console.log(`Created platform admin: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
