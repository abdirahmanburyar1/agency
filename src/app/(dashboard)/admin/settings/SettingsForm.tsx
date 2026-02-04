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
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-white">{label}</h2>
      <ul className="mt-4 space-y-2">
        {values.length === 0 ? (
          <li className="text-sm text-zinc-500 dark:text-zinc-400">No items yet</li>
        ) : (
          values.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded border border-zinc-100 px-3 py-2 dark:border-zinc-800"
            >
              <span className="text-zinc-700 dark:text-zinc-300">{s.value}</span>
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
            className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || !newValue.trim()}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
