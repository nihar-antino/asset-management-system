import { query } from "@/lib/db";
import { getAssetWithHistory } from "@/lib/assets";
import { NextResponse } from "next/server";

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

    values.push(id);
    const result = await query(
      `UPDATE assets SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ asset: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      if (err.constraint === "uniq_assets_serial_number") {
        return NextResponse.json({ error: "Serial number already exists on another asset" }, { status: 409 });
      }
      return NextResponse.json({ error: "Asset tag already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
