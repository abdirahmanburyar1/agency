import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserTenants() {
  try {
    console.log("🔍 Checking user-tenant relationships...\n");

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        isPlatformAdmin: true,
      },
      orderBy: { email: "asc" },
    });

    console.log(`📊 Total users in database: ${users.length}\n`);

    // Categorize users
    const usersWithTenant = users.filter((u) => u.tenantId);
    const usersWithoutTenant = users.filter((u) => !u.tenantId);
    const platformAdmins = users.filter((u) => u.isPlatformAdmin);

    console.log("✅ Users WITH tenant:");
    console.log("─".repeat(80));
    for (const user of usersWithTenant) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId! },
        select: { subdomain: true, name: true, status: true },
      });
      console.log(
        `  ${user.email.padEnd(30)} | Tenant: ${tenant?.subdomain.padEnd(15)} (${tenant?.name}) | Admin: ${user.isPlatformAdmin}`
      );
    }

    console.log("\n❌ Users WITHOUT tenant:");
    console.log("─".repeat(80));
    if (usersWithoutTenant.length === 0) {
      console.log("  None - all users have tenants! ✓");
    } else {
      for (const user of usersWithoutTenant) {
        console.log(
          `  ${user.email.padEnd(30)} | ID: ${user.id} | Admin: ${user.isPlatformAdmin}`
        );
      }
    }

    console.log("\n🔑 Platform Admins:");
    console.log("─".repeat(80));
    for (const user of platformAdmins) {
      console.log(
        `  ${user.email.padEnd(30)} | Tenant: ${user.tenantId || "NONE"}`
      );
    }

    // Check for invalid tenant references
    console.log("\n🔍 Checking for invalid tenant references...");
    console.log("─".repeat(80));
    let invalidCount = 0;
    for (const user of usersWithTenant) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId! },
      });
      if (!tenant) {
        console.log(
          `  ⚠️  ${user.email} references non-existent tenant: ${user.tenantId}`
        );
        invalidCount++;
      }
    }
    if (invalidCount === 0) {
      console.log("  All tenant references are valid! ✓");
    }

    // Summary
    console.log("\n📈 SUMMARY:");
    console.log("─".repeat(80));
    console.log(`  Total users:                ${users.length}`);
    console.log(`  Users with tenant:          ${usersWithTenant.length}`);
    console.log(`  Users without tenant:       ${usersWithoutTenant.length}`);
    console.log(`  Platform admins:            ${platformAdmins.length}`);
    console.log(`  Invalid tenant references:  ${invalidCount}`);

    // Recommendations
    if (usersWithoutTenant.length > 0) {
      console.log("\n⚠️  WARNING: Found users without tenants!");
      console.log(
        "   These users will not be able to log in to any subdomain."
      );
      console.log(
        "   Platform admins should NOT have a tenantId if they only access the root domain."
      );
      console.log(
        "   Other users MUST have a tenantId to access client subdomains."
      );
    }

    if (invalidCount > 0) {
      console.log("\n❌ ERROR: Found users with invalid tenant references!");
      console.log("   These users reference tenants that don't exist.");
    }

    console.log("\n✅ Check complete!\n");
  } catch (error) {
    console.error("❌ Error checking user tenants:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTenants();
