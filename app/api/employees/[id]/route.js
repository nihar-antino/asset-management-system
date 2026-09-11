import { query } from "@/lib/db";
import { getEmployeeWithHistory } from "@/lib/employees";
import { NextResponse } from "next/server";

// GET /api/employees/:id -> employee + all assets ever assigned to them
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const data = await getEmployeeWithHistory(id);
    if (!data) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/employees/:id -> update employee details
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const allowed = ["name", "email", "department", "designation", "phone", "employee_code"];

    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (key in body) {
        const value = body[key] === "" ? null : body[key];
        values.push(value);
        sets.push(`${key} = $${values.length}`);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    values.push(id);
    const result = await query(
      `UPDATE employees SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ employee: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      if (err.constraint === "uniq_employees_employee_code") {
        return NextResponse.json({ error: "Employee code already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: "Employee email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
