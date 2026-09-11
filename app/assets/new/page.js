"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { card, btnPrimary, btnSecondary, input, label } from "@/lib/ui";

const TYPES = ["LAPTOP", "PHONE", "MONITOR", "OTHER"];

export default function NewAssetPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "LAPTOP",
    brand: "",
    model: "",
    serialNumber: "",
    vendor: "",
    purchaseDate: "",
    purchasePrice: "",
    warrantyExpiry: "",
    quantity: 1,
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
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save this asset.");
        setSubmitting(false);
        return;
      }
      router.push("/assets");
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  const isBulk = Number(form.quantity) > 1;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Add asset</h1>
      <p className="text-sm text-ink-soft mb-6">
        Record a purchase. Use quantity to add several identical units from one batch —
        each gets its own asset tag.
      </p>

      <form onSubmit={handleSubmit} className={`${card} p-6 flex flex-col gap-4`}>
        {error && (
          <div className="text-sm text-[var(--status-retired)] bg-[var(--status-retired-bg)] rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <select
              className={input}
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Quantity</label>
            <input
              type="number"
              min="1"
              className={input}
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Brand</label>
            <input
              className={input}
              placeholder="Dell, Apple, Samsung..."
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Model</label>
            <input
              className={input}
              placeholder="Latitude 5440, iPhone 14..."
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
            />
          </div>
        </div>

        {!isBulk && (
          <div>
            <label className={label}>Serial number</label>
            <input
              className={input}
              value={form.serialNumber}
              onChange={(e) => update("serialNumber", e.target.value)}
            />
          </div>
        )}
        {isBulk && (
          <p className="text-xs text-ink-soft -mt-1">
            Serial numbers are skipped for bulk entries — edit each asset individually to add one.
          </p>
        )}

        <div>
          <label className={label}>Vendor</label>
          <input
            className={input}
            placeholder="Dell Direct, Ingram Micro..."
            value={form.vendor}
            onChange={(e) => update("vendor", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label}>Purchase date</label>
            <input
              type="date"
              className={input}
              value={form.purchaseDate}
              onChange={(e) => update("purchaseDate", e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Unit price (₹)</label>
            <input
              type="number"
              className={input}
              value={form.purchasePrice}
              onChange={(e) => update("purchasePrice", e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Warranty until</label>
            <input
              type="date"
              className={input}
              value={form.warrantyExpiry}
              onChange={(e) => update("warrantyExpiry", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button type="submit" className={btnPrimary} disabled={submitting}>
            {submitting ? "Saving..." : isBulk ? `Add ${form.quantity} assets` : "Add asset"}
          </button>
          <button type="button" className={btnSecondary} onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
