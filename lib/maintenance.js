import { query } from "@/lib/db";

export async function listMaintenance({ status } = {}) {
  const params = [];
  let where = "";
  if (status) {
    params.push(status);
    where = `WHERE m.status = $1`;
  }

  const sql = `
    SELECT m.*, a.asset_tag, a.type, a.brand, a.model
    FROM maintenance_logs m
    JOIN assets a ON a.id = m.asset_id
    ${where}
    ORDER BY m.sent_date DESC, m.id DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function getMaintenanceHistoryForAsset(assetId) {
  const result = await query(
    `SELECT * FROM maintenance_logs WHERE asset_id = $1 ORDER BY sent_date DESC, id DESC`,
    [assetId]
  );
  return result.rows;
}
