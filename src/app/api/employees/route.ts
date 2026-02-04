import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET() {
  await requirePermission(PERMISSION.EXPENSES_VIEW);
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, phone: true },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("Employees GET error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requirePermission(PERMISSION.EXPENSES_CREATE);
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const employee = await prisma.employee.create({
      data: {
        name,
        role: body.role?.trim() || null,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
      },
    });
    return NextResponse.json(employee);
  } catch (error) {
    console.error("Employees POST error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
