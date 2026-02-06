import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { auth } from "@/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(PERMISSION.EXPENSES_PAID);
  const { id } = await params;

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  if (expense.status !== "approved") {
    return NextResponse.json(
      { error: "Only approved expenses can be marked as paid" },
      { status: 400 }
    );
  }

  const user = session?.user as { name?: string | null; email?: string | null; roleName?: string } | undefined;
  const paidBy = [user?.name?.trim(), user?.roleName?.trim()].filter(Boolean).join(" — ") || user?.email || "Finance";

  const updated = await prisma.expense.update({
    where: { id },
    data: { status: "paid", paidBy },
  });

  return NextResponse.json(updated);
}
