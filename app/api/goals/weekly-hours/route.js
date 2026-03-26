import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

function toDateStr(d) {
  if (!d) return null
  if (typeof d === 'string') return d.slice(0, 10)
  return new Date(d).toISOString().slice(0, 10)
}

function getSundayOfWeek(dateStr) {
  const d = new Date(toDateStr(dateStr) + 'T12:00:00Z')
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() - day)
  return d.toISOString().slice(0, 10)
}

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = Number(user.id)

    // Get all tasks with hours_logged grouped by week and category
    const { rows } = await sql`
      SELECT
        (DATE_TRUNC('week', t.due_date::date + INTERVAL '1 day') - INTERVAL '1 day')::date AS week_start,
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

    // Get weekly goals with their category and hours target
    const { rows: goalRows } = await sql`
      SELECT
        g.id, g.name, g.hours_per_week,
        g.start_date, g.end_date,
        COALESCE(c.name, 'Uncategorized') AS category_name,
        c.id AS category_id
      FROM weekly_goals g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.user_id = ${userId}
    `

    // Build categories from both tasks AND goals
    const categorySet = new Map()
    rows.forEach((row) => categorySet.set(row.category_name, row.category_id))
    goalRows.forEach((g) => categorySet.set(g.category_name, g.category_id))
    const categories = Array.from(categorySet.entries()).map(([name, id]) => ({ name, id }))

    // Build weeks from both tasks AND goals
    const weekSet = new Set()
    rows.forEach((row) => weekSet.add(toDateStr(row.week_start)))

    // Add weeks from goals (every week the goal spans)
    goalRows.forEach((g) => {
      const goalStart = toDateStr(g.start_date)
      const goalEnd = toDateStr(g.end_date)
      let ws = getSundayOfWeek(goalStart)
      const endDate = new Date(goalEnd + 'T12:00:00Z')
      while (new Date(ws + 'T12:00:00Z') <= endDate) {
        weekSet.add(ws)
        const next = new Date(ws + 'T12:00:00Z')
        next.setUTCDate(next.getUTCDate() + 7)
        ws = next.toISOString().slice(0, 10)
      }
    })

    const weeks = Array.from(weekSet).sort((a, b) => new Date(a) - new Date(b))

    // For each week and category, find the applicable goal target
    function getGoalTarget(weekStart, categoryName) {
      const wsDate = new Date(weekStart + 'T12:00:00Z')
      const weDate = new Date(weekStart + 'T12:00:00Z')
      weDate.setUTCDate(weDate.getUTCDate() + 6)

      const matchingGoals = goalRows.filter((g) =>
        g.category_name === categoryName &&
        new Date(toDateStr(g.start_date) + 'T12:00:00Z') <= weDate &&
        new Date(toDateStr(g.end_date) + 'T12:00:00Z') >= wsDate
      )
      if (!matchingGoals.length) return null
      return matchingGoals.reduce((sum, g) => sum + Number(g.hours_per_week), 0)
    }

    // Build week rows — one row per week with all categories as columns
    const weekRows = weeks.map((week) => {
      const row = { week_start: week, categories: {} }
      let totalLogged = 0
      let totalGoal = 0
      let hasGoal = false

      categories.forEach((cat) => {
        const match = rows.find(
          (r) => toDateStr(r.week_start) === week && r.category_name === cat.name
        )
        const hours = match ? Number(match.total_hours) : 0
        const goal = getGoalTarget(week, cat.name)

        row.categories[cat.name] = {
          logged: hours,
          goal: goal,
          pct: goal ? Math.round((hours / goal) * 100) : null,
        }
        totalLogged += hours
        if (goal) { totalGoal += goal; hasGoal = true }
      })

      row.totalLogged = totalLogged
      row.totalGoal = hasGoal ? totalGoal : null
      row.totalPct = hasGoal && totalGoal > 0 ? Math.round((totalLogged / totalGoal) * 100) : null
      return row
    })

    // Totals row
    const totals = { categories: {} }
    let grandLogged = 0
    let grandGoal = 0
    let hasAnyGoal = false

    categories.forEach((cat) => {
      const sumLogged = rows
        .filter((r) => r.category_name === cat.name)
        .reduce((acc, r) => acc + Number(r.total_hours), 0)

      let sumGoal = 0
      let catHasGoal = false
      weeks.forEach((week) => {
        const g = getGoalTarget(week, cat.name)
        if (g) { sumGoal += g; catHasGoal = true }
      })

      totals.categories[cat.name] = {
        logged: sumLogged,
        goal: catHasGoal ? sumGoal : null,
        pct: catHasGoal && sumGoal > 0 ? Math.round((sumLogged / sumGoal) * 100) : null,
      }
      grandLogged += sumLogged
      if (catHasGoal) { grandGoal += sumGoal; hasAnyGoal = true }
    })

    totals.totalLogged = grandLogged
    totals.totalGoal = hasAnyGoal ? grandGoal : null
    totals.totalPct = hasAnyGoal && grandGoal > 0 ? Math.round((grandLogged / grandGoal) * 100) : null

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
