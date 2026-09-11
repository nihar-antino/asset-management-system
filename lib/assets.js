import { query } from "@/lib/db";

export async function listAssets({ type, status, search } = {}) {
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
  return result.rows;
}

export async function getAssetWithHistory(id) {
  const assetRes = await query(`SELECT * FROM assets WHERE id = $1`, [id]);
  if (assetRes.rows.length === 0) return null;

  const historyRes = await query(
    `SELECT asg.*, e.name as employee_name, e.email as employee_email, e.department
     FROM assignments asg
     JOIN employees e ON e.id = asg.employee_id
     WHERE asg.asset_id = $1
     ORDER BY asg.assigned_date DESC, asg.id DESC`,
    [id]
  );

  return { asset: assetRes.rows[0], history: historyRes.rows };
}
