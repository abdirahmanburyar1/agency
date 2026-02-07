"use client";

type TrackSearchFormProps = {
  action: (formData: FormData) => Promise<void>;
};

export default function TrackSearchForm({ action }: TrackSearchFormProps) {
  return (
    <form action={action} className="space-y-4">
      <input
        type="text"
        name="trackingNumber"
        placeholder="e.g. CRG-2026-000001"
        className="w-full rounded-xl border border-zinc-300 px-4 py-4 text-center text-lg font-mono placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
        autoFocus
        autoComplete="off"
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-amber-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
      >
        Track Shipment
      </button>
    </form>
  );
}
