import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import { card } from "@/lib/ui";
import { getDashboardStats } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statusCount = (s) => stats.byStatus.find((x) => x.status === s)?.count || 0;

  const cards = [
    { label: "Total assets", value: stats.total },
    { label: "In stock", value: statusCount("IN_STOCK") },
    { label: "Assigned", value: statusCount("ASSIGNED") },
    { label: "Retired", value: statusCount("RETIRED") },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-ink-soft mt-0.5">Current stock and recent activity</p>
        </div>
        <Link
          href="/assets/new"
          className="inline-flex items-center px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary-hover"
        >
          Add asset
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`${card} p-5`}>
            <p className="text-sm text-ink-soft mb-2">{c.label}</p>
            <p className="text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className={card}>
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Assets by type</h2>
          </div>
          <div className="p-5">
            {stats.byType.length === 0 && (
              <p className="text-sm text-ink-soft">No assets yet. Add your first purchase batch.</p>
            )}
            <div className="flex flex-col gap-3">
              {stats.byType.map((t) => (
                <div key={t.type} className="flex items-center justify-between">
                  <span className="text-sm">{t.type}</span>
                  <span className="text-sm font-medium">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={card}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Recent activity</h2>
            <Link href="/assign" className="text-xs text-primary font-medium hover:underline">
              Assign / return
            </Link>
          </div>
          <div className="p-2">
            {stats.recentAssignments.length === 0 && (
              <p className="text-sm text-ink-soft px-3 py-4">No assignments yet.</p>
            )}
            {stats.recentAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-3 py-2.5 rounded hover:bg-bg">
                <div className="min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-tag text-xs text-ink-soft">{a.asset_tag}</span>{" "}
                    &middot; {a.employee_name}
                  </p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {a.status === "ACTIVE"
                      ? `Assigned ${fmtDate(a.assigned_date)}`
                      : `Returned ${fmtDate(a.returned_date)}`}
                  </p>
                </div>
                <StatusPill status={a.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
