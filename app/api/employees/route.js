import { query } from "@/lib/db";
import { listEmployees } from "@/lib/employees";
import { NextResponse } from "next/server";

// GET /api/employees?search=
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employees = await listEmployees({ search: searchParams.get("search") });
    return NextResponse.json({ employees });
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
