"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Setting = { id: string; type: string; value: string };

type Props = {
  type: string;
  label: string;
  values: Setting[];
  canEdit: boolean;
};

export default function SettingsForm({ type, label, values, canEdit }: Props) {
  const router = useRouter();
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newValue.trim() || !canEdit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value: newValue.trim() }),
      });
      if (res.ok) {
        setNewValue("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!canEdit) return;
    setDeleting(id);
    try {
      await fetch(`/api/settings/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{label}</h2>
      <ul className="mt-4 space-y-2">
        {values.length === 0 ? (
          <li className="text-sm text-slate-500 dark:text-slate-400">No items yet</li>
        ) : (
          values.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
            >
              <span className="text-slate-700 dark:text-slate-300">{s.value}</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400"
                >
                  Remove
                </button>
              )}
            </li>
          ))
        )}
      </ul>
      {canEdit && (
        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={`Add ${label.toLowerCase()}...`}
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || !newValue.trim()}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
