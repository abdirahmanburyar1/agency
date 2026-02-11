"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateAdminUserForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password, confirmPassword: password });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (res.ok) {
        const user = await res.json();
        alert(
          `Admin user created successfully!\n\nEmail: ${user.email}\nPassword: ${formData.password}\n\nPlease save these credentials securely.`
        );
        setShowForm(false);
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
      >
        Create Admin User
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Admin User</h3>
        <button
          onClick={() => {
            setShowForm(false);
            setError("");
          }}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={generateRandomPassword}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Generate
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Strong password recommended. Use the Generate button for a secure random password.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Re-enter password"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Admin User"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError("");
            }}
            className="rounded-lg border border-slate-300 px-6 py-2 font-semibold dark:border-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        💡 <strong>Tip:</strong> Save the credentials immediately after creation. The password will be shown only once.
      </div>
    </div>
  );
}
