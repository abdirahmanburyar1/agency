"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type DocumentType = {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
};

type VisaDocumentsProps = {
  visaId: string;
  canUpload: boolean;
  canView: boolean;
  canDelete?: boolean;
};

function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext ?? "");
}

export default function VisaDocuments({
  visaId,
  canUpload,
  canView,
  canDelete = false,
}: VisaDocumentsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<DocumentType | null>(null);

  useEffect(() => {
    if (!viewingDoc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingDoc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewingDoc]);

  useEffect(() => {
    if (canView) {
      fetch(`/api/documents?entityType=visa&entityId=${visaId}`)
        .then((r) => r.json())
        .then((data) => setDocuments(Array.isArray(data) ? data : []))
        .catch(() => setDocuments([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [visaId, canView]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !canUpload) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("entityType", "visa");
    formData.set("entityId", visaId);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Failed to upload document");
        return;
      }

      setDocuments((prev) => [data, ...prev]);
      router.refresh();
    } catch {
      alert("Failed to upload document");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete document");
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      router.refresh();
    } catch {
      alert("Failed to delete document");
    }
  }

  if (!canView && !canUpload) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="font-semibold text-zinc-900 dark:text-white">
          Documents
        </h2>
        {canUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleUpload}
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {uploading ? "Uploading..." : "Upload document"}
            </button>
          </>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading documents...
          </p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No documents yet. Upload passport, visa copy, or other files (PDF or images only, saved to ImageKit).
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {doc.fileName}
                  </a>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="rounded border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    View
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingDoc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setViewingDoc(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View document"
        >
          <button
            type="button"
            onClick={() => setViewingDoc(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <div
            className="h-full w-full max-h-[90vh] max-w-[90vw] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isImageFile(viewingDoc.fileName) ? (
              <img
                src={viewingDoc.url}
                alt={viewingDoc.fileName}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <iframe
                src={viewingDoc.url}
                title={viewingDoc.fileName}
                className="h-full w-full min-h-[80vh] rounded bg-white"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
