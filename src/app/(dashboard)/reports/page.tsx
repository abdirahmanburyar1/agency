import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getReportData, type ReportPeriod } from "@/lib/reports";
import ReportsView from "./ReportsView";

const VALID_PERIODS: ReportPeriod[] = ["today", "daily", "monthly", "yearly"];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; period?: string }>;
}) {
  await requirePermission(PERMISSION.DASHBOARD_VIEW, { redirectOnForbidden: true });

  const params = await searchParams;
  const fromStr = params.from ?? "";
  const toStr = params.to ?? "";
  const periodParam = params.period ?? "";
  const fromDate = fromStr ? new Date(fromStr) : undefined;
  const toDate = toStr ? new Date(toStr) : undefined;
  const validRange =
    fromDate &&
    toDate &&
    !Number.isNaN(fromDate.getTime()) &&
    !Number.isNaN(toDate.getTime()) &&
    fromDate <= toDate;
  const period = VALID_PERIODS.includes(periodParam as ReportPeriod) ? (periodParam as ReportPeriod) : undefined;

  const filter = validRange ? { fromDate: fromDate!, toDate: toDate!, period } : undefined;
  const data = await getReportData(filter);

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Reports</h1>
      </div>
      <ReportsView initialData={data} />
    </main>
  );
}
