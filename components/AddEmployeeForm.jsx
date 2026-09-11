"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input, label } from "@/lib/ui";

export default function AddEmployeeForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    phone: "",
    employeeCode: "",
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
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add this employee.");
        setSubmitting(false);
        return;
      }
      setForm({ name: "", email: "", department: "", designation: "", phone: "", employeeCode: "" });
      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
      <div>
        <label className={label}>Department</label>
        <input className={input} value={form.department} onChange={(e) => update("department", e.target.value)} />
      </div>
      <div>
        <label className={label}>Designation</label>
        <input className={input} value={form.designation} onChange={(e) => update("designation", e.target.value)} />
      </div>
      <div>
        <label className={label}>Phone</label>
        <input className={input} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
      </div>
      <div>
        <label className={label}>Employee code</label>
        <input
          className={input}
          placeholder="e.g. EMP-0042"
          value={form.employeeCode}
          onChange={(e) => update("employeeCode", e.target.value)}
        />
      </div>
      <button type="submit" className={btnPrimary} disabled={submitting}>
        {submitting ? "Adding..." : "Add employee"}
      </button>
    </form>
  );
}
