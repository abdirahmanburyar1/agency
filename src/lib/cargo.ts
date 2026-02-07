import { prisma } from "@/lib/db";

export const CARGO_STATUSES = [
  "PENDING",
  "WAREHOUSE",
  "ASSIGNED_TO_MANIFEST",
  "DISPATCHED",
  "ARRIVED",
  "DELIVERED",
] as const;

export type CargoStatus = (typeof CARGO_STATUSES)[number];

/** Default rate per kg for price calculation (USD) */
export const CARGO_RATE_PER_KG = 5;

/**
 * Generates next tracking number in format CRG-YYYY-XXXXXX
 * Uses database for atomic sequence increment
 */
export async function generateTrackingNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const row = await prisma.cargoSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return `CRG-${year}-${String(row.lastValue).padStart(6, "0")}`;
}
