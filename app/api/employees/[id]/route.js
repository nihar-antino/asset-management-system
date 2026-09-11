import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/employees/:id -> employee + all assets ever assigned to them
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const empRes = await query(`SELECT * FROM employees WHERE id = $1`, [id]);
    if (empRes.rows.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const historyRes = await query(
      `SELECT asg.*, a.asset_tag, a.type, a.brand, a.model
       FROM assignments asg
       JOIN assets a ON a.id = asg.asset_id
       WHERE asg.employee_id = $1
       ORDER BY asg.assigned_date DESC, asg.id DESC`,
      [id]
    );

    return NextResponse.json({ employee: empRes.rows[0], history: historyRes.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
