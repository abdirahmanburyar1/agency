import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { auth } from "@/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission(PERMISSION.EXPENSES_APPROVE);
  const { id } = await params;
  const body = await request.json();
  const action = body.action; // "approve" | "reject"

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 });
  }

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  if (expense.status !== "pending") {
    return NextResponse.json(
      { error: `Expense is already ${expense.status}` },
      { status: 400 }
    );
  }

  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      approvedAt: new Date(),
      approvedById: userId ?? null,
    },
  });

  return NextResponse.json(updated);
}
