import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission(PERMISSION.EXPENSES_VIEW);
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { expenses: { orderBy: { date: "desc" }, take: 10 } },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  return NextResponse.json(employee);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission(PERMISSION.EXPENSES_EDIT);
  const { id } = await params;
  const body = await request.json();
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...(body.name != null && { name: String(body.name).trim() || undefined }),
      ...(body.role != null && { role: body.role?.trim() || null }),
      ...(body.phone != null && { phone: body.phone?.trim() || null }),
      ...(body.email != null && { email: body.email?.trim() || null }),
    },
  });
  return NextResponse.json(employee);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission(PERMISSION.EXPENSES_DELETE);
  const { id } = await params;
  await prisma.employee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
