import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/employees?search=
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const params = [];
    let where = "";
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE e.name ILIKE $1 OR e.email ILIKE $1 OR e.department ILIKE $1`;
    }

    const sql = `
      SELECT e.*,
        COUNT(asg.id) FILTER (WHERE asg.status = 'ACTIVE') as active_asset_count
      FROM employees e
      LEFT JOIN assignments asg ON asg.employee_id = e.id
      ${where}
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `;

    const result = await query(sql, params);
    return NextResponse.json({ employees: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/employees
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, department, designation } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO employees (name, email, department, designation)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, email, department || null, designation || null]
    );

    return NextResponse.json({ employee: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return NextResponse.json({ error: "Employee email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
