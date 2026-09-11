import { getClient } from "@/lib/db";
import { getEmployeeWithHistory } from "@/lib/employees";
import { NextResponse } from "next/server";

const EMPLOYMENT_STATUS_VALUES = ["ACTIVE", "INACTIVE"];

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
// Marking employment_status INACTIVE also returns every asset currently
// assigned to them back to stock -- an inactive employee shouldn't keep
// showing as holding equipment.
export async function PATCH(request, { params }) {
  const client = await getClient();
  try {
    const { id } = await params;
    const body = await request.json();
    const allowed = ["name", "email", "department", "designation", "phone", "employee_code", "employment_status"];

    if ("employment_status" in body && !EMPLOYMENT_STATUS_VALUES.includes(body.employment_status)) {
      return NextResponse.json(
        { error: `employment_status must be one of: ${EMPLOYMENT_STATUS_VALUES.join(", ")}` },
        { status: 400 }
      );
    }

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

    await client.query("BEGIN");

    if (body.employment_status === "INACTIVE") {
      const activeRes = await client.query(
        `SELECT id, asset_id FROM assignments WHERE employee_id = $1 AND status = 'ACTIVE' FOR UPDATE`,
        [id]
      );
      for (const assignment of activeRes.rows) {
        await client.query(
          `UPDATE assignments
           SET status = 'RETURNED', returned_date = CURRENT_DATE, return_condition = 'GOOD',
               notes = COALESCE(notes, 'Auto-returned: employee marked inactive')
           WHERE id = $1`,
          [assignment.id]
        );
        await client.query(`UPDATE assets SET status = 'IN_STOCK', condition = 'GOOD' WHERE id = $1`, [
          assignment.asset_id,
        ]);
      }
    }

    values.push(id);
    const result = await client.query(
      `UPDATE employees SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    await client.query("COMMIT");
    return NextResponse.json({ employee: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    if (err.code === "23505") {
      if (err.constraint === "uniq_employees_employee_code") {
        return NextResponse.json({ error: "Employee code already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: "Employee email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
