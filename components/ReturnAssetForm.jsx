"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input, label } from "@/lib/ui";

export default function ReturnAssetForm({ assignmentId }) {
  const router = useRouter();
  const [condition, setCondition] = useState("GOOD");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnCondition: condition, notes }),
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
        <label className={label}>Condition on return</label>
        <select className={input} value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option value="GOOD">Good — back into stock</option>
          <option value="DAMAGED">Damaged — retire</option>
          <option value="LOST">Lost — retire</option>
        </select>
      </div>
      <div>
        <label className={label}>Notes (optional)</label>
        <input
          className={input}
          placeholder="Any observations about condition..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <button type="submit" className={btnPrimary} disabled={submitting}>
        {submitting ? "Processing..." : "Mark as returned"}
      </button>
    </form>
  );
}
