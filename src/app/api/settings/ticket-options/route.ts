import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";

// Public for ticket create form - returns airlines, payment_methods, flights, payment_statuses
// Merges settings with distinct values from existing tickets for backward compatibility
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const perms = (session.user as { permissions?: string[] }).permissions ?? [];
  const isAdmin = (session.user as { roleName?: string }).roleName;
  const canView =
    isAdmin?.toLowerCase() === "admin" ||
    perms.includes(PERMISSION.TICKETS_VIEW) ||
    perms.includes(PERMISSION.TICKETS_CREATE) ||
    perms.includes(PERMISSION.VISAS_VIEW) ||
    perms.includes(PERMISSION.VISAS_CREATE);
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [settings, tickets, receipts, visas] = await Promise.all([
    prisma.setting.findMany({
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { value: "asc" }],
    }),
    prisma.ticket.findMany({
      select: { airline: true, flight: true },
    }),
    prisma.receipt.findMany({ select: { pMethod: true } }),
    prisma.visa.findMany({ select: { country: true } }),
  ]);

  const fromSettings = {
    airline: settings.filter((s) => s.type === "airline").map((s) => s.value),
    payment_method: settings.filter((s) => s.type === "payment_method").map((s) => s.value),
    flight: settings.filter((s) => s.type === "flight").map((s) => s.value),
    payment_status: settings.filter((s) => s.type === "payment_status").map((s) => s.value),
    country: settings.filter((s) => s.type === "country").map((s) => s.value),
  };

  const fromTickets = {
    airline: [...new Set(tickets.map((t) => t.airline).filter((a): a is string => !!a))],
    payment_method: [...new Set(receipts.map((r) => r.pMethod).filter((a): a is string => !!a))],
    payment_status: [] as string[],
  };

  const fromVisas = [...new Set(visas.map((v) => v.country).filter((c): c is string => !!c))];

  return NextResponse.json({
    airline: [...new Set([...fromSettings.airline, ...fromTickets.airline])].sort(),
    payment_method: [...new Set([...fromSettings.payment_method, ...fromTickets.payment_method])].sort(),
    flight: fromSettings.flight,
    payment_status: [...new Set([...fromSettings.payment_status, ...fromTickets.payment_status])].sort(),
    country: [...new Set([...fromSettings.country, ...fromVisas])].sort(),
  });
}
