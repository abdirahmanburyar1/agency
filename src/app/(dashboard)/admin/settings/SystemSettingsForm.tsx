"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type SystemSettings = {
  systemName: string;
  logoUrl: string;
  faviconUrl: string;
};

type Props = { canEdit: boolean };

export default function SystemSettingsForm({ canEdit }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [systemName, setSystemName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  useEffect(() => {
    fetch("/api/settings/system")
      .then((r) => r.json())
      .then((data: SystemSettings) => {
        setSystemName(data.systemName ?? "");
        setLogoUrl(data.logoUrl ?? "");
        setFaviconUrl(data.faviconUrl ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("type", "logo");
      const res = await fetch("/api/settings/system/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
      } else {
        alert(data.error ?? "Upload failed");
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  }

  async function handleFaviconSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;
    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("type", "favicon");
      const res = await fetch("/api/settings/system/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFaviconUrl(data.url);
      } else {
        alert(data.error ?? "Upload failed");
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploadingFavicon(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemName, logoUrl, faviconUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setSystemName(data.systemName ?? systemName);
        setLogoUrl(data.logoUrl ?? logoUrl);
        setFaviconUrl(data.faviconUrl ?? faviconUrl);
        router.refresh();
      } else {
        alert(data.error ?? "Save failed");
      }
    } catch {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">General</h2>
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">General</h2>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        System name, logo, and favicon are used across the app (sidebar, login, reports, PDFs). Logo and favicon are stored in ImageKit.
      </p>
      <div className="space-y-4">
        <div>
          <label htmlFor="system-name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            System name
          </label>
          <input
            id="system-name"
            type="text"
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white disabled:opacity-60"
            placeholder="Daybah Travel Agency"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Logo
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleLogoSelect}
                disabled={!canEdit || uploadingLogo}
                className="sr-only"
              />
              {uploadingLogo ? "Uploading…" : "Choose logo"}
            </label>
            {logoUrl && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Preview:</span>
                <img src={logoUrl} alt="" className="h-8 max-w-[120px] object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Favicon
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/x-icon,.ico"
                onChange={handleFaviconSelect}
                disabled={!canEdit || uploadingFavicon}
                className="sr-only"
              />
              {uploadingFavicon ? "Uploading…" : "Choose favicon"}
            </label>
            {faviconUrl && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Preview:</span>
                <img src={faviconUrl} alt="" className="size-6 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>
        </div>
      </div>
      {canEdit && (
        <div className="mt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </form>
  );
}
