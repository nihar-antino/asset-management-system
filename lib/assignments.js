import { query } from "@/lib/db";

export async function listAssignments({ status } = {}) {
  const params = [];
  let where = "";
  if (status) {
    params.push(status);
    where = `WHERE asg.status = $1`;
  }

  const sql = `
    SELECT asg.*, a.asset_tag, a.type, a.brand, a.model,
           e.name as employee_name, e.email as employee_email
    FROM assignments asg
    JOIN assets a ON a.id = asg.asset_id
    JOIN employees e ON e.id = asg.employee_id
    ${where}
    ORDER BY asg.assigned_date DESC, asg.id DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}
