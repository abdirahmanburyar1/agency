import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import SettingsForm from "./SettingsForm";
import CurrencyRatesForm from "./CurrencyRatesForm";
import LocationsBranchesForm from "./LocationsBranchesForm";

const TYPES = [
  { type: "airline", label: "Airlines" },
  { type: "payment_method", label: "Payment Methods" },
  { type: "flight", label: "Flights" },
  { type: "payment_status", label: "Payment Statuses" },
  { type: "country", label: "Countries" },
  { type: "expense_category", label: "Expense Categories" },
  { type: "cargo_carrier_air", label: "Carriers (Air)" },
  { type: "cargo_carrier_road", label: "Carriers (Road)" },
  { type: "cargo_carrier_sea", label: "Carriers (Sea)" },
] as const;

export default async function SettingsPage() {
  await requirePermission(PERMISSION.SETTINGS_VIEW, { redirectOnForbidden: true });
  const canEdit = await (await import("@/lib/permissions")).canAccess(PERMISSION.SETTINGS_EDIT);

  const settings = await prisma.setting.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { value: "asc" }],
  });

  const grouped = TYPES.map((t) => ({
    type: t.type,
    label: t.label,
    values: settings.filter((s) => s.type === t.type),
  }));

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Ticket Settings
          </h1>
        </div>
      </div>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Configure airlines, payment methods, flights, payment statuses, countries, expense categories, locations & branches, carriers, and currency rates. Currency rates are used in reports and dashboard to convert multi-currency expenses to USD.
      </p>
      <div className="space-y-8">
        <CurrencyRatesForm canEdit={canEdit} />
        <LocationsBranchesForm canEdit={canEdit} />
        {grouped.map(({ type, label, values }) => (
          <SettingsForm
            key={type}
            type={type}
            label={label}
            values={values}
            canEdit={canEdit}
          />
        ))}
      </div>
    </main>
  );
}
