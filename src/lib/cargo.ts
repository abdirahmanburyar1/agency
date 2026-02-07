import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PERMISSION } from "@/lib/permissions";

export const CARGO_STATUSES = [
  "PENDING",
  "WAREHOUSE",
  "ASSIGNED_TO_MANIFEST",
  "DISPATCHED",
  "ARRIVED",
  "DELIVERED",
] as const;

export type CargoStatus = (typeof CARGO_STATUSES)[number];

/** Statuses that only source branch can transition to/from (PENDING→WAREHOUSE→ASSIGNED_TO_MANIFEST→DISPATCHED) */
const SOURCE_BRANCH_STATUSES: CargoStatus[] = ["PENDING", "WAREHOUSE", "ASSIGNED_TO_MANIFEST", "DISPATCHED"];

/** Statuses that only destination branch can transition to (DISPATCHED→ARRIVED→DELIVERED) */
const DESTINATION_BRANCH_STATUSES: CargoStatus[] = ["ARRIVED", "DELIVERED"];

/**
 * Returns whether the user can perform status actions on this shipment, and which statuses they can transition to.
 * - Admin or cargo.view_all: can do all transitions
 * - Source branch: PENDING→WAREHOUSE, WAREHOUSE→ASSIGNED_TO_MANIFEST, ASSIGNED_TO_MANIFEST→DISPATCHED
 * - Destination branch: DISPATCHED→ARRIVED, ARRIVED→DELIVERED
 * - Neither: no actions
 */
export function getCargoStatusActions(
  userBranchId: string | null,
  sourceBranchId: string | null,
  destinationBranchId: string | null,
  currentStatus: string,
  isAdminOrViewAll: boolean
): { canShowActions: boolean; allowedNextStatuses: CargoStatus[] } {
  if (isAdminOrViewAll) {
    const idx = CARGO_STATUSES.indexOf(currentStatus as CargoStatus);
    const allowed = idx >= 0 ? CARGO_STATUSES.slice(idx + 1) : [];
    return { canShowActions: allowed.length > 0, allowedNextStatuses: allowed };
  }
  if (!userBranchId || (!sourceBranchId && !destinationBranchId)) {
    return { canShowActions: false, allowedNextStatuses: [] };
  }

  const isSource = sourceBranchId && userBranchId === sourceBranchId;
  const isDestination = destinationBranchId && userBranchId === destinationBranchId;

  let allowed: CargoStatus[] = [];
  if (isSource) {
    // Source: PENDING→WAREHOUSE, WAREHOUSE→ASSIGNED_TO_MANIFEST, ASSIGNED_TO_MANIFEST→DISPATCHED
    const currentIdx = SOURCE_BRANCH_STATUSES.indexOf(currentStatus as CargoStatus);
    if (currentIdx >= 0 && currentIdx < SOURCE_BRANCH_STATUSES.length - 1) {
      allowed = [SOURCE_BRANCH_STATUSES[currentIdx + 1]];
    }
  } else if (isDestination) {
    // Destination: DISPATCHED→ARRIVED, ARRIVED→DELIVERED
    if (currentStatus === "DISPATCHED") {
      allowed = ["ARRIVED"];
    } else if (currentStatus === "ARRIVED") {
      allowed = ["DELIVERED"];
    }
  }

  return {
    canShowActions: allowed.length > 0,
    allowedNextStatuses: allowed,
  };
}

/** Default rate per kg for price calculation (USD) */
export const CARGO_RATE_PER_KG = 5;

/**
 * Returns Prisma where clause to filter cargo shipments by user eligibility.
 * - Admin or cargo.view_all: no filter (see all)
 * - User with location: see shipments where source OR destination is in their location
 * - User without location: see nothing
 */
export function getCargoVisibilityWhere(
  isAdminOrViewAll: boolean,
  userLocationId: string | null
): Prisma.CargoShipmentWhereInput {
  if (isAdminOrViewAll) return {};
  if (!userLocationId) return { id: "never-match" };
  return {
    OR: [
      { sourceBranch: { locationId: userLocationId } },
      { destinationBranch: { locationId: userLocationId } },
    ],
  };
}

/**
 * Returns Prisma where clause for cargo report: only shipments SENT FROM the user's branch.
 * - Admin or cargo.view_all: no filter (see all)
 * - User with branchId: see shipments where sourceBranchId = userBranchId
 * - User with locationId only: see shipments where source is in their location
 * - User without location: see nothing
 */
export function getCargoReportVisibilityWhere(
  isAdminOrViewAll: boolean,
  userLocationId: string | null,
  userBranchId: string | null
): Prisma.CargoShipmentWhereInput {
  if (isAdminOrViewAll) return {};
  if (!userLocationId && !userBranchId) return { id: "never-match" };
  if (userBranchId) {
    return { sourceBranchId: userBranchId };
  }
  return { sourceBranch: { locationId: userLocationId! } };
}

/**
 * Returns Prisma where clause for Payment to restrict by location.
 * - Admin, cargo.view_all, or payments.view_all: no filter (see all payments)
 * - User with location but no view_all (cargo-section, branch finance): only cargo payments for shipments in their location
 * - User without location: no cargo payments when restricted (empty set)
 */
export function getPaymentVisibilityWhere(
  isAdminOrCargoViewAll: boolean,
  hasPaymentsViewAll: boolean,
  hasCargoOrPaymentsView: boolean,
  userLocationId: string | null
): Prisma.PaymentWhereInput {
  if (isAdminOrCargoViewAll || hasPaymentsViewAll) return {};
  if (!hasCargoOrPaymentsView) return {};
  const cargoWhere = getCargoVisibilityWhere(false, userLocationId);
  return { cargoShipment: cargoWhere }; // Only cargo payments whose shipment matches
}

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
