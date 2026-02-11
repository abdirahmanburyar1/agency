import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDuplicateAdmin() {
  try {
    console.log("🔍 Finding duplicate admin@buryar.com accounts...\n");

    // Get all admin@buryar.com users
    const duplicateUsers = await prisma.user.findMany({
      where: {
        email: "admin@buryar.com",
      },
      orderBy: {
        createdAt: "asc", // Oldest first
      },
      include: {
        tenant: {
          select: {
            subdomain: true,
            name: true,
          },
        },
      },
    });

    console.log(`Found ${duplicateUsers.length} user(s) with email admin@buryar.com:\n`);

    duplicateUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Tenant: ${user.tenant?.subdomain || "NONE"} (${user.tenant?.name || "N/A"})`);
      console.log(`   Is Platform Admin: ${user.isPlatformAdmin}`);
      console.log("");
    });

    if (duplicateUsers.length <= 1) {
      console.log("✅ No duplicates found. Only one admin@buryar.com exists.\n");
      return;
    }

    // Keep the oldest one, delete the rest
    const keepUser = duplicateUsers[0];
    const deleteUsers = duplicateUsers.slice(1);

    console.log(`✅ KEEPING (oldest):`);
    console.log(`   ID: ${keepUser.id}`);
    console.log(`   Created: ${keepUser.createdAt}`);
    console.log(`   Tenant: ${keepUser.tenant?.subdomain || "NONE"}\n`);

    console.log(`❌ DELETING (newer):`);
    for (const user of deleteUsers) {
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Tenant: ${user.tenant?.subdomain || "NONE"}`);
    }
    console.log("");

    // Delete the newer duplicates
    for (const user of deleteUsers) {
      console.log(`🗑️  Deleting user ${user.id} (${user.email}, tenant: ${user.tenant?.subdomain || "NONE"})...`);
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`   ✓ Deleted successfully`);
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted ${deleteUsers.length} duplicate account(s)`);
    console.log(`   Kept 1 original account (${keepUser.id})\n`);

    // Show final platform admin users
    console.log("📋 Final list of platform admin users:");
    console.log("─".repeat(80));
    const platformAdmins = await prisma.user.findMany({
      where: {
        isPlatformAdmin: true,
      },
      include: {
        tenant: {
          select: {
            subdomain: true,
            name: true,
          },
        },
      },
    });

    platformAdmins.forEach((admin) => {
      console.log(`  ${admin.email.padEnd(30)} | Tenant: ${admin.tenant?.subdomain || "NONE".padEnd(15)}`);
    });

    console.log(`\n✅ Total platform admin users: ${platformAdmins.length}\n`);

    if (platformAdmins.length > 1) {
      console.log("⚠️  WARNING: Multiple platform admin users exist!");
      console.log("   Typically, you should have only ONE platform admin user.");
      console.log("   Consider setting isPlatformAdmin=false for client-specific admins.\n");
    }

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateAdmin();
