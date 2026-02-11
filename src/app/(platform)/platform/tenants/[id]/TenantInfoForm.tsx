"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TenantInfoForm({ tenant }: { tenant: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant.name || "",
    contactName: tenant.contactName || "",
    contactEmail: tenant.contactEmail || "",
    contactPhone: tenant.contactPhone || "",
    companyAddress: tenant.companyAddress || "",
    companyCity: tenant.companyCity || "",
    companyCountry: tenant.companyCountry || "",
    taxId: tenant.taxId || "",
    businessType: tenant.businessType || "",
    websiteUrl: tenant.websiteUrl || "",
    notes: tenant.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/platform/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.refresh();
        alert("Client information updated successfully!");
      } else {
        alert("Failed to update client information");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Contact Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Contact Person
          </label>
          <input
            type="text"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Contact Email
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Contact Phone
          </label>
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Business Type
          </label>
          <select
            value={formData.businessType}
            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Select type</option>
            <option value="travel_agency">Travel Agency</option>
            <option value="tour_operator">Tour Operator</option>
            <option value="cargo">Cargo & Logistics</option>
            <option value="visa_services">Visa Services</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Tax ID */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tax ID / Registration Number
          </label>
          <input
            type="text"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Company Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Company Address
          </label>
          <input
            type="text"
            value={formData.companyAddress}
            onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            City
          </label>
          <input
            type="text"
            value={formData.companyCity}
            onChange={(e) => setFormData({ ...formData, companyCity: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Country
          </label>
          <input
            type="text"
            value={formData.companyCountry}
            onChange={(e) => setFormData({ ...formData, companyCountry: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Website */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Website URL
          </label>
          <input
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            placeholder="https://example.com"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Internal Notes
          </label>
          <textarea
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Internal notes about this client..."
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
