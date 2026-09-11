"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { card, btnPrimary, btnSecondary, input, label } from "@/lib/ui";

function toDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default function EditAssetForm({ asset }) {
  const router = useRouter();
  const [form, setForm] = useState({
    brand: asset.brand || "",
    model: asset.model || "",
    serialNumber: asset.serial_number || "",
    vendor: asset.vendor || "",
    ram: asset.ram || "",
    storage: asset.storage || "",
    os: asset.os || "",
    purchaseDate: toDateInput(asset.purchase_date),
    purchasePrice: asset.purchase_price ?? "",
    warrantyExpiry: toDateInput(asset.warranty_expiry),
    condition: asset.condition || "NEW",
    notes: asset.notes || "",
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
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand,
          model: form.model,
          serial_number: form.serialNumber,
          vendor: form.vendor,
          ram: form.ram,
          storage: form.storage,
          os: form.os,
          purchase_date: form.purchaseDate,
          purchase_price: form.purchasePrice,
          warranty_expiry: form.warrantyExpiry,
          condition: form.condition,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save these changes.");
        setSubmitting(false);
        return;
      }
      router.push(`/assets/${asset.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">
        Edit <span className="font-tag">{asset.asset_tag}</span>
      </h1>
      <p className="text-sm text-ink-soft mb-6">{asset.type} — asset tag can't be changed here.</p>

      <form onSubmit={handleSubmit} className={`${card} p-6 flex flex-col gap-4`}>
        {error && (
          <div className="text-sm text-[var(--status-retired)] bg-[var(--status-retired-bg)] rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Brand</label>
            <input className={input} value={form.brand} onChange={(e) => update("brand", e.target.value)} />
          </div>
          <div>
            <label className={label}>Model</label>
            <input className={input} value={form.model} onChange={(e) => update("model", e.target.value)} />
          </div>
        </div>

        <div>
          <label className={label}>Serial number</label>
          <input
            className={input}
            value={form.serialNumber}
            onChange={(e) => update("serialNumber", e.target.value)}
          />
        </div>

        <div>
          <label className={label}>Vendor</label>
          <input className={input} value={form.vendor} onChange={(e) => update("vendor", e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label}>RAM</label>
            <input className={input} placeholder="16GB" value={form.ram} onChange={(e) => update("ram", e.target.value)} />
          </div>
          <div>
            <label className={label}>Storage</label>
            <input
              className={input}
              placeholder="512GB SSD"
              value={form.storage}
              onChange={(e) => update("storage", e.target.value)}
            />
          </div>
          <div>
            <label className={label}>OS</label>
            <input
              className={input}
              placeholder="Windows 11 Pro"
              value={form.os}
              onChange={(e) => update("os", e.target.value)}
            />
          </div>
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

        <div>
          <label className={label}>Condition</label>
          <select className={input} value={form.condition} onChange={(e) => update("condition", e.target.value)}>
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="DAMAGED">Damaged</option>
          </select>
        </div>

        <div>
          <label className={label}>Notes</label>
          <input className={input} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
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
