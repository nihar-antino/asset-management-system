import { query, getClient } from "@/lib/db";
import { getAssetWithHistory } from "@/lib/assets";
import { NextResponse } from "next/server";

// Assets only ever move to these two statuses through this endpoint.
// ASSIGNED and UNDER_MAINTENANCE are set exclusively by POST
// /api/assignments and POST /api/maintenance, which are the only places
// that also create the matching assignment/maintenance row -- allowing
// them here would let those tables disagree about who has the asset.
const DIRECT_STATUS_VALUES = ["IN_STOCK", "RETIRED"];

// GET /api/assets/:id -> asset details + full assignment history
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const data = await getAssetWithHistory(id);
    if (!data) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/assets/:id -> update asset details / status (e.g. retire)
export async function PATCH(request, { params }) {
  const client = await getClient();
  try {
    const { id } = await params;
    const body = await request.json();
    const allowed = [
      "brand",
      "model",
      "serial_number",
      "vendor",
      "purchase_date",
      "purchase_price",
      "warranty_expiry",
      "status",
      "condition",
      "notes",
    ];

    if ("status" in body && !DIRECT_STATUS_VALUES.includes(body.status)) {
      return NextResponse.json(
        {
          error: `status must be one of: ${DIRECT_STATUS_VALUES.join(
            ", "
          )}. Assign an asset through the Assign/Return page instead.`,
        },
        { status: 400 }
      );
    }

    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (key in body) {
        // Empty string means "clear this field" -- store NULL rather than ""
        // so date/numeric columns don't fail to cast and unique checks
        // (e.g. serial_number) treat it as absent rather than a real value.
        const value = body[key] === "" ? null : body[key];
        values.push(value);
        sets.push(`${key} = $${values.length}`);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await client.query("BEGIN");

    if ("status" in body) {
      // Lock the asset row so a concurrent assign can't slip in between
      // this check and the update below.
      const assetRes = await client.query(`SELECT id FROM assets WHERE id = $1 FOR UPDATE`, [id]);
      if (assetRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }

      const activeAssignmentRes = await client.query(
        `SELECT id FROM assignments WHERE asset_id = $1 AND status = 'ACTIVE'`,
        [id]
      );
      if (activeAssignmentRes.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "This asset is currently assigned. Return it before changing its status." },
          { status: 409 }
        );
      }

      const activeMaintenanceRes = await client.query(
        `SELECT id FROM maintenance_logs WHERE asset_id = $1 AND status = 'ACTIVE'`,
        [id]
      );
      if (activeMaintenanceRes.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "This asset is under maintenance. Mark it returned before changing its status." },
          { status: 409 }
        );
      }
    }

    values.push(id);
    const result = await client.query(
      `UPDATE assets SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await client.query("COMMIT");
    return NextResponse.json({ asset: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    if (err.code === "23505") {
      if (err.constraint === "uniq_assets_serial_number") {
        return NextResponse.json({ error: "Serial number already exists on another asset" }, { status: 409 });
      }
      return NextResponse.json({ error: "Asset tag already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
