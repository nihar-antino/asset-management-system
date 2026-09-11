import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import { card, th, td } from "@/lib/ui";
import { listAssets } from "@/lib/assets";

export const dynamic = "force-dynamic";

const TYPES = ["LAPTOP", "PHONE", "MONITOR", "OTHER"];
const STATUSES = ["IN_STOCK", "ASSIGNED", "UNDER_MAINTENANCE", "RETIRED"];

function FilterLink({ label, active, href }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded text-sm font-medium border ${
        active
          ? "bg-primary text-white border-primary"
          : "border-border text-ink-soft hover:bg-bg"
      }`}
    >
      {label}
    </Link>
  );
}

function fmtMoney(v) {
  if (v == null) return "—";
  return `₹${Number(v).toLocaleString("en-IN")}`;
}

export default async function AssetsPage({ searchParams }) {
  const sp = await searchParams;
  const assets = await listAssets({ type: sp.type, status: sp.status, search: sp.search });

  const buildHref = (key, value) => {
    const params = new URLSearchParams(sp);
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    return qs ? `/assets?${qs}` : "/assets";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Assets</h1>
          <p className="text-sm text-ink-soft mt-0.5">{assets.length} shown</p>
        </div>
        <Link
          href="/assets/new"
          className="inline-flex items-center px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary-hover"
        >
          Add asset
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <FilterLink label="All types" active={!sp.type} href={buildHref("type", null)} />
        {TYPES.map((t) => (
          <FilterLink key={t} label={t} active={sp.type === t} href={buildHref("type", t)} />
        ))}
        <span className="mx-2 w-px h-5 bg-border" />
        <FilterLink label="All statuses" active={!sp.status} href={buildHref("status", null)} />
        {STATUSES.map((s) => (
          <FilterLink key={s} label={s.replace("_", " ")} active={sp.status === s} href={buildHref("status", s)} />
        ))}
      </div>

      <form action="/assets" method="get" className="mb-5">
        {sp.type && <input type="hidden" name="type" value={sp.type} />}
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <div className="flex items-center gap-2">
          <input
            type="text"
            name="search"
            defaultValue={sp.search || ""}
            placeholder="Search by brand, model, tag, or serial number..."
            className="w-full max-w-sm px-3 py-2 rounded border border-border bg-surface text-sm text-ink placeholder:text-ink-soft focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded border border-border text-sm font-medium text-ink-soft hover:bg-bg"
          >
            Search
          </button>
          {sp.search && (
            <Link href={buildHref("search", null)} className="text-sm text-ink-soft hover:text-ink">
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className={`${card} overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className="bg-bg">
              <th className={th}>Asset tag</th>
              <th className={th}>Type</th>
              <th className={th}>Brand / model</th>
              <th className={th}>Purchased</th>
              <th className={th}>Status</th>
              <th className={th}>Assigned to</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && (
              <tr>
                <td className={td} colSpan={7}>
                  <p className="text-ink-soft py-4 text-center">
                    No assets match these filters yet.
                  </p>
                </td>
              </tr>
            )}
            {assets.map((a) => (
              <tr key={a.id} className="hover:bg-bg">
                <td className={td}>
                  <span className="font-tag text-xs">{a.asset_tag}</span>
                </td>
                <td className={td}>{a.type}</td>
                <td className={td}>
                  {a.brand || "—"} {a.model || ""}
                </td>
                <td className={td}>{fmtMoney(a.purchase_price)}</td>
                <td className={td}>
                  <StatusPill status={a.status} />
                </td>
                <td className={td}>{a.current_employee_name || "—"}</td>
                <td className={td}>
                  <Link href={`/assets/${a.id}`} className="text-primary text-sm font-medium hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
