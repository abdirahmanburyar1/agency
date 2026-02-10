import { redirect } from "next/navigation";
import { getSystemSettings } from "@/lib/system-settings";
import TrackSearchForm from "./TrackSearchForm";

export async function generateMetadata() {
  const { systemName } = await getSystemSettings();
  return {
    title: `Track Cargo | ${systemName}`,
    description: "Track your cargo shipment by tracking number",
  };
}

export default function TrackPage() {
  async function handleSearch(formData: FormData) {
    "use server";
    const trackingNumber = formData.get("trackingNumber") as string | null;
    const normalized = String(trackingNumber ?? "").trim().toUpperCase();
    if (normalized) {
      redirect(`/track/${encodeURIComponent(normalized)}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-slate-100 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-zinc-900 dark:text-white">
          Track Your Cargo
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Enter your tracking number to see shipment status
        </p>
        <TrackSearchForm action={handleSearch} />
        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Format: CRG-YYYY-XXXXXX
        </p>
      </div>
    </div>
  );
}
