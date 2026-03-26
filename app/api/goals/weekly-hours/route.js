import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = Number(user.id)

    // Get all tasks with hours_logged grouped by week and category
    const { rows } = await sql`
      SELECT
        DATE_TRUNC('week', t.due_date::date)::date AS week_start,
        COALESCE(c.name, 'Uncategorized') AS category_name,
        c.id AS category_id,
        SUM(COALESCE(t.hours_logged, 0)) AS total_hours
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ${userId}
        AND t.hours_logged IS NOT NULL
        AND t.hours_logged > 0
        AND t.due_date IS NOT NULL
      GROUP BY week_start, c.name, c.id
      ORDER BY week_start DESC, c.name
    `

    // Get unique categories and weeks
    const categorySet = new Map()
    const weekSet = new Set()

    rows.forEach((row) => {
      categorySet.set(row.category_name, row.category_id)
      weekSet.add(row.week_start)
    })

    const categories = Array.from(categorySet.entries()).map(([name, id]) => ({ name, id }))
    const weeks = Array.from(weekSet).sort((a, b) => new Date(a) - new Date(b))

    // Build week rows
    const weekRows = weeks.map((week) => {
      const row = { week_start: week, categories: {} }
      let total = 0
      categories.forEach((cat) => {
        const match = rows.find(
          (r) => r.week_start === week && r.category_name === cat.name
        )
        const hours = match ? Number(match.total_hours) : 0
        row.categories[cat.name] = hours
        total += hours
      })
      row.total = total
      return row
    })

    // Totals row
    const totals = { categories: {} }
    let grandTotal = 0
    categories.forEach((cat) => {
      const sum = rows
        .filter((r) => r.category_name === cat.name)
        .reduce((acc, r) => acc + Number(r.total_hours), 0)
      totals.categories[cat.name] = sum
      grandTotal += sum
    })
    totals.total = grandTotal

    return NextResponse.json({
      categories,
      weeks: weekRows,
      totals,
      weekCount: weeks.length,
    })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
