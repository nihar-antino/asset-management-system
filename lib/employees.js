import { query } from "@/lib/db";

export async function listEmployees({ search, status } = {}) {
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`e.employment_status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(e.name ILIKE $${params.length} OR e.email ILIKE $${params.length} OR e.department ILIKE $${params.length})`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT e.*,
      COUNT(asg.id) FILTER (WHERE asg.status = 'ACTIVE') as active_asset_count
    FROM employees e
    LEFT JOIN assignments asg ON asg.employee_id = e.id
    ${where}
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function getEmployee(id) {
  const result = await query(`SELECT * FROM employees WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function getEmployeeWithHistory(id) {
  const empRes = await query(`SELECT * FROM employees WHERE id = $1`, [id]);
  if (empRes.rows.length === 0) return null;

  const historyRes = await query(
    `SELECT asg.*, a.asset_tag, a.type, a.brand, a.model
     FROM assignments asg
     JOIN assets a ON a.id = asg.asset_id
     WHERE asg.employee_id = $1
     ORDER BY asg.assigned_date DESC, asg.id DESC`,
    [id]
  );

  return { employee: empRes.rows[0], history: historyRes.rows };
}
