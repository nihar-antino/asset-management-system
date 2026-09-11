"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnDanger } from "@/lib/ui";

export default function RetireAssetForm({ assetId }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleRetire() {
    if (!confirm("Retire this asset? It will no longer be available to assign.")) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RETIRED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not retire this asset.");
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
    <div>
      {error && (
        <div className="text-sm text-[var(--status-retired)] bg-[var(--status-retired-bg)] rounded px-3 py-2 mb-3">
          {error}
        </div>
      )}
      <button type="button" className={btnDanger} onClick={handleRetire} disabled={submitting}>
        {submitting ? "Retiring..." : "Retire asset"}
      </button>
    </div>
  );
}
