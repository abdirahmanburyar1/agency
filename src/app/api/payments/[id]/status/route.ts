import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

// Only credit/pending can be manually set; paid/partial are determined by receipts
const VALID_MANUAL_STATUS = ["pending", "credit"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.PAYMENTS_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "").toLowerCase();
    if (!VALID_MANUAL_STATUS.includes(status as (typeof VALID_MANUAL_STATUS)[number])) {
      return NextResponse.json(
        { error: `Status can only be set to: ${VALID_MANUAL_STATUS.join(", ")}. Paid and partial are determined by receipts.` },
        { status: 400 }
      );
    }

    const data: { status: string; expectedDate?: Date | null } = { status };
    if (status === "credit") {
      data.expectedDate = body.expectedDate ? new Date(body.expectedDate) : null;
    } else {
      data.expectedDate = null; // clear when setting to pending
    }

    const payment = await prisma.payment.update({
      where: { id },
      data,
    });
    return NextResponse.json(payment);
  } catch (error) {
    console.error("Update payment status error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
