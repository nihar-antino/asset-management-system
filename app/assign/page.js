import Link from "next/link";
import { Suspense } from "react";
import StatusPill from "@/components/StatusPill";
import AssignForm from "@/components/AssignForm";
import { card } from "@/lib/ui";
import { listAssignments } from "@/lib/assignments";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AssignPage() {
  const assignments = await listAssignments({ status: "ACTIVE" });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Assign / Return</h1>
        <p className="text-sm text-ink-soft mt-0.5">Hand out available stock, or process a return from an asset's page</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className={card}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Assign an asset</h2>
            </div>
            <div className="p-5">
              <Suspense fallback={<p className="text-sm text-ink-soft">Loading...</p>}>
                <AssignForm />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className={card}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Currently assigned ({assignments.length})</h2>
            </div>
            <div className="p-2">
              {assignments.length === 0 && (
                <p className="text-sm text-ink-soft px-3 py-4">Nothing is currently assigned.</p>
              )}
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-3 py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm">
                      <span className="font-tag text-xs text-ink-soft">{a.asset_tag}</span>{" "}
                      <span className="font-medium">{a.employee_name}</span>
                    </p>
                    <p className="text-xs text-ink-soft mt-0.5">Since {fmtDate(a.assigned_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={a.status} />
                    <Link href={`/assets/${a.asset_id}`} className="text-primary text-sm font-medium hover:underline">
                      Return →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
