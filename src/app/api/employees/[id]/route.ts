import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { auth } from "@/auth";
import { getTenantIdFromSession } from "@/lib/tenant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission(PERMISSION.EXPENSES_VIEW);
  const session = await auth();
  const tenantId = getTenantIdFromSession(session);
  const { id } = await params;
  
  const employee = await prisma.employee.findFirst({
    where: { 
      id,
      tenantId, // SCOPE BY TENANT - security check
    },
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
  const session = await auth();
  const tenantId = getTenantIdFromSession(session);
  const { id } = await params;
  
  // Verify employee belongs to tenant
  const existing = await prisma.employee.findFirst({ where: { id, tenantId } });
  if (!existing) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  
  await prisma.employee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
