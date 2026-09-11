"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input, label } from "@/lib/ui";

export default function ReturnFromMaintenanceForm({ maintenanceId }) {
  const router = useRouter();
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cost: cost || null, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not process the return.");
        setSubmitting(false);
        return;
      }
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
        <label className={label}>Repair cost (₹, optional)</label>
        <input
          type="number"
          className={input}
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
      </div>
      <div>
        <label className={label}>Notes (optional)</label>
        <input
          className={input}
          placeholder="What was done..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <button type="submit" className={btnPrimary} disabled={submitting}>
        {submitting ? "Processing..." : "Mark returned, back in stock"}
      </button>
    </form>
  );
}
