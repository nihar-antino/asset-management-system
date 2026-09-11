"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { card, btnPrimary, btnSecondary, input, label } from "@/lib/ui";

export default function EditEmployeeForm({ employee }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: employee.name || "",
    email: employee.email || "",
    department: employee.department || "",
    designation: employee.designation || "",
    phone: employee.phone || "",
    employeeCode: employee.employee_code || "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          department: form.department,
          designation: form.designation,
          phone: form.phone,
          employee_code: form.employeeCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save these changes.");
        setSubmitting(false);
        return;
      }
      router.push(`/employees/${employee.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Edit {employee.name}</h1>
      <p className="text-sm text-ink-soft mb-6">Update contact and identity details.</p>

      <form onSubmit={handleSubmit} className={`${card} p-6 flex flex-col gap-4`}>
        {error && (
          <div className="text-sm text-[var(--status-retired)] bg-[var(--status-retired-bg)] rounded px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className={label}>Full name</label>
          <input className={input} value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </div>

        <div>
          <label className={label}>Email</label>
          <input
            type="email"
            className={input}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Department</label>
            <input
              className={input}
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Designation</label>
            <input
              className={input}
              value={form.designation}
              onChange={(e) => update("designation", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Phone</label>
            <input className={input} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <label className={label}>Employee code</label>
            <input
              className={input}
              value={form.employeeCode}
              onChange={(e) => update("employeeCode", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button type="submit" className={btnPrimary} disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </button>
          <button type="button" className={btnSecondary} onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
