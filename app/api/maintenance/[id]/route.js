import { getClient } from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH /api/maintenance/:id
// Body: { returnedDate, cost, notes }
// Marks an active maintenance record as returned and puts the asset back IN_STOCK.
export async function PATCH(request, { params }) {
  const client = await getClient();
  try {
    const { id } = await params;
    const body = await request.json();
    const { returnedDate, cost, notes } = body;

    await client.query("BEGIN");

    const logRes = await client.query(`SELECT * FROM maintenance_logs WHERE id = $1 FOR UPDATE`, [id]);
    if (logRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });
    }
    if (logRes.rows[0].status !== "ACTIVE") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This maintenance record is already closed" }, { status: 409 });
    }

    const updatedLog = await client.query(
      `UPDATE maintenance_logs
       SET status = 'RETURNED', returned_date = COALESCE($1, CURRENT_DATE),
           cost = COALESCE($2, cost), notes = COALESCE($3, notes)
       WHERE id = $4 RETURNING *`,
      [returnedDate || null, cost || null, notes || null, id]
    );

    await client.query(`UPDATE assets SET status = 'IN_STOCK' WHERE id = $1`, [logRes.rows[0].asset_id]);

    await client.query("COMMIT");
    return NextResponse.json({ maintenance: updatedLog.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
