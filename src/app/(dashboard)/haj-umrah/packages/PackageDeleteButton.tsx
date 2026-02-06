"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { TrashIcon } from "../icons";

type Props = {
  packageId: string;
  packageName: string;
};

export default function PackageDeleteButton({ packageId, packageName }: Props) {
  const router = useRouter();

  async function handleDelete() {
    const result = await Swal.fire({
      title: "Delete package?",
      html: `This will permanently delete <strong>${packageName}</strong>. Existing bookings will keep the package name and amount.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/haj-umrah/packages/${packageId}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error ?? "Failed to delete package",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Package deleted",
        timer: 1200,
        showConfirmButton: false,
      });
      router.refresh();
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete package",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
      title="Delete"
    >
      <TrashIcon className="size-4" />
      Delete
    </button>
  );
}
