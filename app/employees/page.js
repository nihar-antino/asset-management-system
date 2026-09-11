import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import { card, th, td } from "@/lib/ui";
import { listEmployees } from "@/lib/employees";
import AddEmployeeForm from "@/components/AddEmployeeForm";

export const dynamic = "force-dynamic";

const STATUSES = ["ACTIVE", "INACTIVE"];

function FilterLink({ label, active, href }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded text-sm font-medium border ${
        active ? "bg-primary text-white border-primary" : "border-border text-ink-soft hover:bg-bg"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function EmployeesPage({ searchParams }) {
  const sp = await searchParams;
  const employees = await listEmployees({ status: sp.status });

  const buildHref = (value) => {
    const params = new URLSearchParams(sp);
    if (value) params.set("status", value);
    else params.delete("status");
    const qs = params.toString();
    return qs ? `/employees?${qs}` : "/employees";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Employees</h1>
        <p className="text-sm text-ink-soft mt-0.5">{employees.length} in directory</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <FilterLink label="All" active={!sp.status} href={buildHref(null)} />
            {STATUSES.map((s) => (
              <FilterLink key={s} label={s === "ACTIVE" ? "Active" : "Inactive"} active={sp.status === s} href={buildHref(s)} />
            ))}
          </div>

          <div className={`${card} overflow-hidden`}>
            <table className="w-full">
              <thead>
                <tr className="bg-bg">
                  <th className={th}>Name</th>
                  <th className={th}>Department</th>
                  <th className={th}>Active assets</th>
                  <th className={th}>Status</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr>
                    <td className={td} colSpan={5}>
                      <p className="text-ink-soft py-4 text-center">No employees yet.</p>
                    </td>
                  </tr>
                )}
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-bg">
                    <td className={td}>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-ink-soft">{e.email}</p>
                    </td>
                    <td className={td}>{e.department || "—"}</td>
                    <td className={td}>{e.active_asset_count}</td>
                    <td className={td}>
                      <StatusPill status={e.employment_status} />
                    </td>
                    <td className={td}>
                      <Link href={`/employees/${e.id}`} className="text-primary text-sm font-medium hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className={card}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Add employee</h2>
            </div>
            <div className="p-5">
              <AddEmployeeForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
