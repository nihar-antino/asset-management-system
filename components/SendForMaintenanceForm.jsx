"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnSecondary, input, label } from "@/lib/ui";

export default function SendForMaintenanceForm({ assetId }) {
  const router = useRouter();
  const [vendor, setVendor] = useState("");
  const [issue, setIssue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!issue.trim()) {
      setError("Describe the issue before sending this asset for maintenance.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, vendor, issue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send this asset for maintenance.");
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
        <label className={label}>Issue</label>
        <input
          className={input}
          placeholder="e.g. Screen flicker, battery not charging..."
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        />
      </div>
      <div>
        <label className={label}>Vendor (optional)</label>
        <input
          className={input}
          placeholder="Dell Service Center..."
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
        />
      </div>
      <button type="submit" className={btnSecondary} disabled={submitting}>
        {submitting ? "Sending..." : "Send for maintenance"}
      </button>
    </form>
  );
}
