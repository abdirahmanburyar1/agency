/**
 * Clear tickets, payments, receipts, and related data.
 * Keeps: Settings, Users, Roles, Permissions, Customers, Documents.
 *
 * Run: npx tsx prisma/clear-transaction-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing transaction data...");

  const receiptCount = await prisma.receipt.deleteMany({});
  console.log(`  Deleted ${receiptCount.count} receipts`);

  const documentCount = await prisma.document.deleteMany({
    where: {
      entityType: { in: ["ticket", "visa", "payment", "receipt"] },
    },
  });
  console.log(`  Deleted ${documentCount.count} documents (ticket/visa/payment/receipt)`);

  const paymentCount = await prisma.payment.deleteMany({});
  console.log(`  Deleted ${paymentCount.count} payments`);

  const adjustmentCount = await prisma.ticketAdjustment.deleteMany({});
  console.log(`  Deleted ${adjustmentCount.count} ticket adjustments`);

  const payableCount = await prisma.payable.deleteMany({});
  console.log(`  Deleted ${payableCount.count} payables`);

  const ticketCount = await prisma.ticket.deleteMany({});
  console.log(`  Deleted ${ticketCount.count} tickets`);

  const visaCount = await prisma.visa.deleteMany({});
  console.log(`  Deleted ${visaCount.count} visas`);

  console.log("Done. Settings, users, roles, permissions, and customers preserved.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
