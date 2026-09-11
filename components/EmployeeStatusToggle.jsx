"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnSecondary, btnDanger } from "@/lib/ui";

export default function EmployeeStatusToggle({ employeeId, employmentStatus }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isActive = employmentStatus === "ACTIVE";
  const nextStatus = isActive ? "INACTIVE" : "ACTIVE";
  const confirmMessage = isActive
    ? "Mark this employee as inactive? Any assets currently assigned to them will be returned to stock, and they can no longer be assigned new equipment."
    : "Mark this employee as active again?";

  async function handleToggle() {
    if (!confirm(confirmMessage)) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employment_status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update employment status.");
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
      <button
        type="button"
        className={isActive ? btnDanger : btnSecondary}
        onClick={handleToggle}
        disabled={submitting}
      >
        {submitting ? "Updating..." : isActive ? "Mark as inactive" : "Mark as active"}
      </button>
    </div>
  );
}
