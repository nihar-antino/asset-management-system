import { getClient } from "@/lib/db";
import { listMaintenance } from "@/lib/maintenance";
import { NextResponse } from "next/server";

// GET /api/maintenance?status=ACTIVE
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const maintenance = await listMaintenance({ status: searchParams.get("status") });
    return NextResponse.json({ maintenance });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/maintenance
// Body: { assetId, vendor, issue, sentDate, notes }
// Sends an in-stock asset out for maintenance. Fails if asset isn't IN_STOCK.
export async function POST(request) {
  try {
    const body = await request.json();
    const { assetId, vendor, issue, sentDate, notes } = body;

    if (!assetId || !issue) {
      return NextResponse.json({ error: "assetId and issue are required" }, { status: 400 });
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
          { error: `Asset is currently ${assetRes.rows[0].status}, not available to send for maintenance` },
          { status: 409 }
        );
      }

      const logRes = await client.query(
        `INSERT INTO maintenance_logs (asset_id, vendor, issue, sent_date, notes)
         VALUES ($1,$2,$3,COALESCE($4, CURRENT_DATE),$5) RETURNING *`,
        [assetId, vendor || null, issue, sentDate || null, notes || null]
      );

      await client.query(`UPDATE assets SET status = 'UNDER_MAINTENANCE' WHERE id = $1`, [assetId]);

      await client.query("COMMIT");
      return NextResponse.json({ maintenance: logRes.rows[0] }, { status: 201 });
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
