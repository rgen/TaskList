import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = Number(user.id)
    const { rows: [{ count: total }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND status != 'archived'`
    const { rows: [{ count: completed }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND status = 'completed'`
    const { rows: [{ count: pending }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND status != 'completed' AND status != 'archived'`
    const { rows: [{ count: overdue }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND due_date < CURRENT_DATE::text AND status != 'completed' AND status != 'archived'`
    const { rows: [{ count: high }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND priority = 'high' AND status != 'archived'`
    const { rows: [{ count: medium }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND priority = 'medium' AND status != 'archived'`
    const { rows: [{ count: low }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND priority = 'low' AND status != 'archived'`
    const { rows: byStatusRows } = await sql`SELECT status, COUNT(*)::int as count FROM tasks WHERE user_id = ${userId} AND status != 'archived' GROUP BY status`
    const { rows: byCategoryRows } = await sql`
      SELECT COALESCE(c.name, 'Uncategorized') as name, c.id as category_id, COUNT(t.id)::int as count
      FROM tasks t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ${userId} AND t.status != 'archived'
      GROUP BY c.id, c.name
      ORDER BY count DESC`

    const { rows: byWeekRows } = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('week', due_date::date), 'YYYY-MM-DD') as week_start,
        COUNT(*)::int as count
      FROM tasks
      WHERE user_id = ${userId} AND status != 'archived' AND due_date IS NOT NULL
      GROUP BY DATE_TRUNC('week', due_date::date)
      ORDER BY week_start ASC`

    const { rows: schoolWorkSubRows } = await sql`
      SELECT sc.name, sc.id as subcategory_id, COUNT(t.id)::int as count
      FROM tasks t
      JOIN subcategories sc ON sc.id = t.subcategory_id
      JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ${userId} AND t.status != 'archived' AND LOWER(c.name) = 'school work'
      GROUP BY sc.id, sc.name
      ORDER BY count DESC`

    return NextResponse.json({
      total: +total,
      completed: +completed,
      pending: +pending,
      overdue: +overdue,
      byPriority: { high: +high, medium: +medium, low: +low },
      byStatus: byStatusRows,
      byCategory: byCategoryRows,
      schoolWorkSubcategories: schoolWorkSubRows,
    })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
