import { getClient } from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH /api/assignments/:id
// Body: { returnedDate, returnCondition, notes }
// Marks an active assignment as returned and updates the asset's status accordingly.
export async function PATCH(request, { params }) {
  const client = await getClient();
  try {
    const { id } = await params;
    const body = await request.json();
    const { returnedDate, returnCondition, notes } = body;

    await client.query("BEGIN");

    const assignRes = await client.query(
      `SELECT * FROM assignments WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (assignRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    if (assignRes.rows[0].status !== "ACTIVE") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This assignment is already closed" }, { status: 409 });
    }

    const updatedAssignment = await client.query(
      `UPDATE assignments
       SET status = 'RETURNED', returned_date = COALESCE($1, CURRENT_DATE),
           return_condition = $2, notes = COALESCE($3, notes)
       WHERE id = $4 RETURNING *`,
      [returnedDate || null, returnCondition || "GOOD", notes || null, id]
    );

    // Damaged/lost items go to RETIRED rather than back into circulation
    const newAssetStatus = returnCondition === "DAMAGED" || returnCondition === "LOST"
      ? "RETIRED"
      : "IN_STOCK";
    const newCondition = returnCondition === "LOST" ? "RETIRED" : (returnCondition || "GOOD");

    await client.query(
      `UPDATE assets SET status = $1, condition = $2 WHERE id = $3`,
      [newAssetStatus, newCondition, assignRes.rows[0].asset_id]
    );

    await client.query("COMMIT");
    return NextResponse.json({ assignment: updatedAssignment.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
