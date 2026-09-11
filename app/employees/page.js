import Link from "next/link";
import { card, th, td } from "@/lib/ui";
import { getBaseUrl } from "@/lib/baseUrl";
import AddEmployeeForm from "@/components/AddEmployeeForm";

async function getEmployees() {
  const res = await fetch(`${getBaseUrl()}/api/employees`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load employees");
  return res.json();
}

export default async function EmployeesPage() {
  const { employees } = await getEmployees();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Employees</h1>
        <p className="text-sm text-ink-soft mt-0.5">{employees.length} in directory</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className={`${card} overflow-hidden`}>
            <table className="w-full">
              <thead>
                <tr className="bg-bg">
                  <th className={th}>Name</th>
                  <th className={th}>Department</th>
                  <th className={th}>Active assets</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr>
                    <td className={td} colSpan={4}>
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
