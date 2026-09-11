import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import ReturnAssetForm from "@/components/ReturnAssetForm";
import RetireAssetForm from "@/components/RetireAssetForm";
import SendForMaintenanceForm from "@/components/SendForMaintenanceForm";
import ReturnFromMaintenanceForm from "@/components/ReturnFromMaintenanceForm";
import { card } from "@/lib/ui";
import { getAssetWithHistory } from "@/lib/assets";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtMoney(v) {
  if (v == null) return "—";
  return `₹${Number(v).toLocaleString("en-IN")}`;
}

export default async function AssetDetailPage({ params }) {
  const { id } = await params;
  const data = await getAssetWithHistory(id);
  if (!data) notFound();

  const { asset, history, maintenance } = data;
  const activeAssignment = history.find((h) => h.status === "ACTIVE");
  const activeMaintenance = maintenance.find((m) => m.status === "ACTIVE");

  const specs = [
    ["Type", asset.type],
    ["Brand / model", [asset.brand, asset.model].filter(Boolean).join(" ") || "—"],
    ["Serial number", asset.serial_number || "—"],
    ["Vendor", asset.vendor || "—"],
    ["Purchased", fmtDate(asset.purchase_date)],
    ["Unit price", fmtMoney(asset.purchase_price)],
    ["Warranty until", fmtDate(asset.warranty_expiry)],
    ["Condition", asset.condition],
  ];

  return (
    <div>
      <Link href="/assets" className="text-sm text-ink-soft hover:text-ink">
        ← Back to assets
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold font-tag">{asset.asset_tag}</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            {[asset.brand, asset.model].filter(Boolean).join(" ") || asset.type}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/assets/${asset.id}/edit`} className="text-sm text-primary font-medium hover:underline">
            Edit
          </Link>
          <StatusPill status={asset.status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className={card}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Specifications</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-y-3 gap-x-6">
              {specs.map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-ink-soft">{k}</p>
                  <p className="text-sm mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={card}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Assignment history</h2>
            </div>
            <div className="p-2">
              {history.length === 0 && (
                <p className="text-sm text-ink-soft px-3 py-4">
                  This asset hasn't been assigned to anyone yet.
                </p>
              )}
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between px-3 py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{h.employee_name}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {fmtDate(h.assigned_date)} → {h.returned_date ? fmtDate(h.returned_date) : "present"}
                      {h.return_condition ? ` · returned ${h.return_condition.toLowerCase()}` : ""}
                    </p>
                    {h.notes && <p className="text-xs text-ink-soft mt-0.5">{h.notes}</p>}
                  </div>
                  <StatusPill status={h.status} />
                </div>
              ))}
            </div>
          </div>

          <div className={card}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Maintenance history</h2>
            </div>
            <div className="p-2">
              {maintenance.length === 0 && (
                <p className="text-sm text-ink-soft px-3 py-4">
                  This asset hasn't been sent for maintenance.
                </p>
              )}
              {maintenance.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.issue}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {m.vendor ? `${m.vendor} · ` : ""}
                      {fmtDate(m.sent_date)} → {m.returned_date ? fmtDate(m.returned_date) : "present"}
                      {m.cost ? ` · ${fmtMoney(m.cost)}` : ""}
                    </p>
                    {m.notes && <p className="text-xs text-ink-soft mt-0.5">{m.notes}</p>}
                  </div>
                  <StatusPill status={m.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {asset.status === "ASSIGNED" && activeAssignment && (
            <div className={card}>
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-sm">Currently with</h2>
              </div>
              <div className="p-5">
                <p className="text-sm font-medium">{activeAssignment.employee_name}</p>
                <p className="text-xs text-ink-soft mt-0.5">{activeAssignment.employee_email}</p>
                <p className="text-xs text-ink-soft">{activeAssignment.department}</p>
                <p className="text-xs text-ink-soft mt-2">Since {fmtDate(activeAssignment.assigned_date)}</p>
              </div>
              <div className="px-5 pb-5">
                <ReturnAssetForm assignmentId={activeAssignment.id} />
              </div>
            </div>
          )}

          {asset.status === "IN_STOCK" && (
            <div className={card}>
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-sm">Available</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-ink-soft mb-3">
                  This asset is in stock and ready to assign.
                </p>
                <Link href={`/assign?assetId=${asset.id}`} className="text-primary text-sm font-medium hover:underline">
                  Assign to an employee →
                </Link>
              </div>
              <div className="px-5 pb-5 pt-1 border-t border-border">
                <SendForMaintenanceForm assetId={asset.id} />
              </div>
              <div className="px-5 pb-5 pt-1 border-t border-border">
                <RetireAssetForm assetId={asset.id} />
              </div>
            </div>
          )}

          {asset.status === "UNDER_MAINTENANCE" && activeMaintenance && (
            <div className={card}>
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-sm">Under maintenance</h2>
              </div>
              <div className="p-5">
                <p className="text-sm font-medium">{activeMaintenance.issue}</p>
                {activeMaintenance.vendor && (
                  <p className="text-xs text-ink-soft mt-0.5">{activeMaintenance.vendor}</p>
                )}
                <p className="text-xs text-ink-soft mt-2">Sent {fmtDate(activeMaintenance.sent_date)}</p>
              </div>
              <div className="px-5 pb-5">
                <ReturnFromMaintenanceForm maintenanceId={activeMaintenance.id} />
              </div>
            </div>
          )}

          {asset.status === "RETIRED" && (
            <div className={card}>
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-sm">Retired</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-ink-soft">
                  This asset was retired and is no longer in circulation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
