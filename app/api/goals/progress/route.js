import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = Number(user.id)
    const { rows } = await sql`
      WITH week_bounds AS (
        SELECT
          DATE_TRUNC('week', CURRENT_DATE)::date AS week_start,
          (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days')::date AS week_end
      )
      SELECT
        wg.id,
        wg.name,
        wg.hours_per_week,
        wg.tasks_per_week,
        wg.start_date,
        wg.end_date,
        c.name AS category_name,
        sc.name AS subcategory_name,
        wb.week_start,
        wb.week_end,
        -- Current week stats
        COUNT(t.id) FILTER (
          WHERE t.due_date::date >= wb.week_start AND t.due_date::date < wb.week_end
        )::int AS week_tasks,
        COUNT(t.id) FILTER (
          WHERE t.status = 'completed'
            AND t.due_date::date >= wb.week_start AND t.due_date::date < wb.week_end
        )::int AS week_tasks_done,
        COALESCE(SUM(t.hours_logged) FILTER (
          WHERE t.due_date::date >= wb.week_start AND t.due_date::date < wb.week_end
        ), 0)::numeric AS week_hours_logged,
        -- All time stats
        COUNT(t.id)::int AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'completed')::int AS total_tasks_done,
        COALESCE(SUM(t.hours_logged), 0)::numeric AS total_hours_logged,
        COALESCE(SUM(wg.hours_per_week * (
          EXTRACT(EPOCH FROM (LEAST(wg.end_date::date, wb.week_end) - wg.start_date::date)) / (7 * 86400)
        )), 0)::numeric AS total_hours_goal
      FROM weekly_goals wg
      CROSS JOIN week_bounds wb
      LEFT JOIN categories c ON c.id = wg.category_id
      LEFT JOIN subcategories sc ON sc.id = wg.subcategory_id
      LEFT JOIN tasks t ON t.goal_id = wg.id
      WHERE wg.user_id = ${userId}
      GROUP BY wg.id, c.name, sc.name, wb.week_start, wb.week_end
      ORDER BY wg.created_at DESC`

    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
