import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/assets?type=LAPTOP&status=IN_STOCK&search=abc
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const conditions = [];
    const params = [];

    if (type) {
      params.push(type);
      conditions.push(`a.type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(a.asset_tag ILIKE $${params.length} OR a.brand ILIKE $${params.length} OR a.model ILIKE $${params.length} OR a.serial_number ILIKE $${params.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT a.*,
        e.id as current_employee_id, e.name as current_employee_name
      FROM assets a
      LEFT JOIN assignments asg ON asg.asset_id = a.id AND asg.status = 'ACTIVE'
      LEFT JOIN employees e ON e.id = asg.employee_id
      ${where}
      ORDER BY a.created_at DESC
    `;

    const result = await query(sql, params);
    return NextResponse.json({ assets: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/assets
// Body: { assetTag, type, brand, model, serialNumber, vendor, purchaseDate, purchasePrice, warrantyExpiry, quantity }
// If quantity > 1, creates multiple assets with auto-suffixed tags (bulk purchase entry)
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      assetTag,
      type,
      brand,
      model,
      serialNumber,
      vendor,
      purchaseDate,
      purchasePrice,
      warrantyExpiry,
      quantity,
    } = body;

    if (!type) {
      return NextResponse.json({ error: "Asset type is required" }, { status: 400 });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const created = [];

    for (let i = 0; i < qty; i++) {
      const tag =
        qty > 1
          ? `${assetTag || type.slice(0, 3).toUpperCase()}-${Date.now()}-${i + 1}`
          : assetTag || `${type.slice(0, 3).toUpperCase()}-${Date.now()}`;

      const result = await query(
        `INSERT INTO assets
          (asset_tag, type, brand, model, serial_number, vendor, purchase_date, purchase_price, warranty_expiry)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          tag,
          type,
          brand || null,
          model || null,
          qty > 1 ? null : serialNumber || null,
          vendor || null,
          purchaseDate || null,
          purchasePrice || null,
          warrantyExpiry || null,
        ]
      );
      created.push(result.rows[0]);
    }

    return NextResponse.json({ assets: created }, { status: 201 });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return NextResponse.json({ error: "Asset tag already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
