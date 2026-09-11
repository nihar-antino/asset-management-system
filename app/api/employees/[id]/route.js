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
