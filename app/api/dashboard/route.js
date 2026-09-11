import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [totals, byType, byStatus, recentAssignments] = await Promise.all([
      query(`SELECT COUNT(*)::int as total FROM assets`),
      query(`SELECT type, COUNT(*)::int as count FROM assets GROUP BY type ORDER BY count DESC`),
      query(`SELECT status, COUNT(*)::int as count FROM assets GROUP BY status`),
      query(`
        SELECT asg.id, asg.status, asg.assigned_date, asg.returned_date,
               a.asset_tag, a.type, e.name as employee_name
        FROM assignments asg
        JOIN assets a ON a.id = asg.asset_id
        JOIN employees e ON e.id = asg.employee_id
        ORDER BY asg.created_at DESC
        LIMIT 8
      `),
    ]);

    return NextResponse.json({
      total: totals.rows[0].total,
      byType: byType.rows,
      byStatus: byStatus.rows,
      recentAssignments: recentAssignments.rows,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
