import EditEmployeeForm from "@/components/EditEmployeeForm";
import { getEmployee } from "@/lib/employees";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditEmployeePage({ params }) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  return <EditEmployeeForm employee={employee} />;
}
