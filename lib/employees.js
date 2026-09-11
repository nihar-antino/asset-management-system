import { query } from "@/lib/db";

export async function listEmployees({ search } = {}) {
  const params = [];
  let where = "";
  if (search) {
    params.push(`%${search}%`);
    where = `WHERE e.name ILIKE $1 OR e.email ILIKE $1 OR e.department ILIKE $1`;
  }

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
