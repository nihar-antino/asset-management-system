import { query, getClient } from "@/lib/db";
import { listAssignments } from "@/lib/assignments";
import { NextResponse } from "next/server";

// GET /api/assignments?status=ACTIVE
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignments = await listAssignments({ status: searchParams.get("status") });
    return NextResponse.json({ assignments });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/assignments
// Body: { assetId, employeeId, assignedDate, notes }
// Assigns an available asset to an employee. Fails if asset isn't IN_STOCK.
export async function POST(request) {
  try {
    const body = await request.json();
    const { assetId, employeeId, assignedDate, notes } = body;

    if (!assetId || !employeeId) {
      return NextResponse.json({ error: "assetId and employeeId are required" }, { status: 400 });
    }

    const client = await getClient();
    try {
      await client.query("BEGIN");

      const assetRes = await client.query(`SELECT * FROM assets WHERE id = $1 FOR UPDATE`, [assetId]);
      if (assetRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }
      if (assetRes.rows[0].status !== "IN_STOCK") {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: `Asset is currently ${assetRes.rows[0].status}, not available to assign` },
          { status: 409 }
        );
      }

      const employeeRes = await client.query(`SELECT id, employment_status FROM employees WHERE id = $1`, [
        employeeId,
      ]);
      if (employeeRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      if (employeeRes.rows[0].employment_status !== "ACTIVE") {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "This employee is marked inactive and can't be assigned new equipment" },
          { status: 409 }
        );
      }

      const assignRes = await client.query(
        `INSERT INTO assignments (asset_id, employee_id, assigned_date, notes)
         VALUES ($1,$2,COALESCE($3, CURRENT_DATE),$4) RETURNING *`,
        [assetId, employeeId, assignedDate || null, notes || null]
      );

      await client.query(`UPDATE assets SET status = 'ASSIGNED' WHERE id = $1`, [assetId]);

      await client.query("COMMIT");
      return NextResponse.json({ assignment: assignRes.rows[0] }, { status: 201 });
    } catch (innerErr) {
      await client.query("ROLLBACK");
      throw innerErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
