"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { btnPrimary, input, label } from "@/lib/ui";

export default function AssignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAssetId = searchParams.get("assetId") || "";

  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assetId, setAssetId] = useState(preselectedAssetId);
  const [employeeId, setEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadOptions() {
    setLoading(true);
    const [assetsRes, employeesRes] = await Promise.all([
      fetch("/api/assets?status=IN_STOCK"),
      fetch("/api/employees"),
    ]);
    const assetsData = await assetsRes.json();
    const employeesData = await employeesRes.json();
    setAssets(assetsData.assets || []);
    setEmployees(employeesData.employees || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOptions();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!assetId || !employeeId) {
      setError("Choose both an asset and an employee.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: Number(assetId), employeeId: Number(employeeId), notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not assign this asset.");
        setSubmitting(false);
        return;
      }
      setAssetId("");
      setEmployeeId("");
      setNotes("");
      setSubmitting(false);
      loadOptions();
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading available assets...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="text-sm text-[var(--status-retired)] bg-[var(--status-retired-bg)] rounded px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className={label}>Asset</label>
        <select className={input} value={assetId} onChange={(e) => setAssetId(e.target.value)}>
          <option value="">Select an available asset...</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.asset_tag} — {a.type} {[a.brand, a.model].filter(Boolean).join(" ")}
            </option>
          ))}
        </select>
        {assets.length === 0 && (
          <p className="text-xs text-ink-soft mt-1">No assets currently in stock.</p>
        )}
      </div>

      <div>
        <label className={label}>Employee</label>
        <select className={input} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">Select an employee...</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} {e.department ? `— ${e.department}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>Notes (optional)</label>
        <input
          className={input}
          placeholder="e.g. Onboarding, replacement for damaged unit..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button type="submit" className={btnPrimary} disabled={submitting || assets.length === 0}>
        {submitting ? "Assigning..." : "Assign asset"}
      </button>
    </form>
  );
}
