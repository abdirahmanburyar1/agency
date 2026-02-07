"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type CargoImage = {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
};

type CargoImagesProps = {
  shipmentId: string;
  canUpload: boolean;
  canDelete: boolean;
};

const IMAGE_EXTENSIONS = "image/jpeg,image/png,image/gif,image/webp,image/bmp";

export default function CargoImages({
  shipmentId,
  canUpload,
  canDelete,
}: CargoImagesProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [images, setImages] = useState<CargoImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<CargoImage | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/cargo/${shipmentId}/images`)
      .then((r) => r.json())
      .then((data) => setImages(Array.isArray(data) ? data : []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [shipmentId]);

  useEffect(() => {
    if (!viewingImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewingImage]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !canUpload) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
    if (!ext || !allowed.includes(ext)) {
      alert(`Only image files are allowed (${allowed.join(", ")})`);
      e.target.value = "";
      return;
    }

    await uploadFile(file);
    e.target.value = "";
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);

    try {
      const res = await fetch(`/api/cargo/${shipmentId}/images`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Failed to upload image");
        return;
      }

      setImages((prev) => [data, ...prev]);
      router.refresh();
    } catch {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraError(null);
  }, []);

  async function openCamera() {
    setCameraError(null);
    setCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      await new Promise((r) => setTimeout(r, 100));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = stream;
        await new Promise((r) => setTimeout(r, 100));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (fallbackErr) {
        setCameraError("Could not access camera. Please check permissions.");
        console.error("Camera error:", fallbackErr);
      }
    }
  }

  async function capturePhoto() {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        stopCamera();
        const file = new File([blob], `cargo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        await uploadFile(file);
      },
      "image/jpeg",
      0.9
    );
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function handleDelete(imageId: string) {
    if (!confirm("Delete this image?")) return;

    try {
      const res = await fetch(`/api/cargo/${shipmentId}/images/${imageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert("Failed to delete image");
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      router.refresh();
    } catch {
      alert("Failed to delete image");
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <h2 className="font-semibold text-zinc-900 dark:text-white">Images</h2>
        {canUpload && (
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={IMAGE_EXTENSIONS}
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <button
              type="button"
              onClick={openCamera}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              {uploading ? "Uploading..." : "Take photo"}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Choose image
            </button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading images...</p>
        ) : images.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No images yet. Use &quot;Take photo&quot; to capture with your camera or &quot;Choose image&quot; to upload from your device.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <button
                  type="button"
                  onClick={() => setViewingImage(img)}
                  className="block h-full w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  <img
                    src={img.url}
                    alt={img.fileName}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  <p className="truncate text-xs text-white">{img.fileName}</p>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img.id);
                      }}
                      className="mt-1 text-xs font-medium text-red-300 hover:text-red-200"
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

      {cameraOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Take photo"
        >
          <button
            type="button"
            onClick={() => stopCamera()}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close camera"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          {cameraError ? (
            <p className="text-center text-red-400">{cameraError}</p>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />
              <div className="mt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => stopCamera()}
                  className="rounded-lg border border-zinc-500 px-6 py-3 text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={uploading}
                  className="rounded-lg bg-amber-600 px-8 py-3 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Capture"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {viewingImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setViewingImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View image"
        >
          <button
            type="button"
            onClick={() => setViewingImage(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <div
            className="flex h-full w-full max-h-[90vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewingImage.url}
              alt={viewingImage.fileName}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
