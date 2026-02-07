import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { auth } from "@/auth";

/** Approve all pending expenses in a given month (YYYY-MM). */
export async function POST(request: Request) {
  await requirePermission(PERMISSION.EXPENSES_APPROVE);
  try {
    const body = await request.json();
    const month = body.month ? String(body.month).trim() : "";
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Invalid month. Use YYYY-MM (e.g. 2026-02)" }, { status: 400 });
    }

    const [year, mon] = month.split("-").map(Number);
    const from = new Date(year, mon - 1, 1);
    const to = new Date(year, mon, 0, 23, 59, 59, 999);

    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;

    const result = await prisma.expense.updateMany({
      where: {
        status: "pending",
        date: { gte: from, lte: to },
      },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedById: userId ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      approved: result.count,
      message: `Approved ${result.count} expense${result.count !== 1 ? "s" : ""} for ${month}`,
    });
  } catch (error) {
    console.error("Expenses approve-batch error:", error);
    return NextResponse.json({ error: "Failed to approve batch" }, { status: 500 });
  }
}
