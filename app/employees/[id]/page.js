import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import { card } from "@/lib/ui";
import { getEmployeeWithHistory } from "@/lib/employees";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function EmployeeDetailPage({ params }) {
  const { id } = await params;
  const data = await getEmployeeWithHistory(id);
  if (!data) notFound();

  const { employee, history } = data;
  const active = history.filter((h) => h.status === "ACTIVE");

  const profile = [
    ["Email", employee.email],
    ["Department", employee.department || "—"],
    ["Designation", employee.designation || "—"],
    ["Phone", employee.phone || "—"],
    ["Employee code", employee.employee_code || "—"],
    ["Joined directory", fmtDate(employee.created_at)],
  ];

  return (
    <div>
      <Link href="/employees" className="text-sm text-ink-soft hover:text-ink">
        ← Back to employees
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <h1 className="text-xl font-semibold">{employee.name}</h1>
        <Link href={`/employees/${employee.id}/edit`} className="text-sm text-primary font-medium hover:underline">
          Edit
        </Link>
      </div>

      <div className={`${card} mb-6`}>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Profile</h2>
        </div>
        <div className="p-5 grid grid-cols-2 gap-y-3 gap-x-6">
          {profile.map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-ink-soft">{k}</p>
              <p className="text-sm mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Asset history</h2>
          <span className="text-xs text-ink-soft">{active.length} currently assigned</span>
        </div>
        <div className="p-2">
          {history.length === 0 && (
            <p className="text-sm text-ink-soft px-3 py-4">
              No assets have been assigned to this employee yet.
            </p>
          )}
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between px-3 py-3 border-b border-border last:border-0">
              <div>
                <Link href={`/assets/${h.asset_id}`} className="text-sm font-medium font-tag hover:underline">
                  {h.asset_tag}
                </Link>
                <p className="text-xs text-ink-soft mt-0.5">
                  {h.type} {[h.brand, h.model].filter(Boolean).join(" ")}
                </p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {fmtDate(h.assigned_date)} → {h.returned_date ? fmtDate(h.returned_date) : "present"}
                </p>
              </div>
              <StatusPill status={h.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
