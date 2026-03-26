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

    // Get unique categories and weeks
    const categorySet = new Map()
    const weekSet = new Set()

    rows.forEach((row) => {
      categorySet.set(row.category_name, row.category_id)
      weekSet.add(row.week_start)
    })

    const categories = Array.from(categorySet.entries()).map(([name, id]) => ({ name, id }))
    const weeks = Array.from(weekSet).sort((a, b) => new Date(a) - new Date(b))

    // For each week and category, find the applicable goal target
    // A goal matches a week if the goal's date range overlaps with the week (Sun-Sat)
    function getGoalTarget(weekStart, categoryName) {
      const wsDate = new Date(weekStart)
      const weDate = new Date(weekStart)
      weDate.setDate(weDate.getDate() + 6) // Saturday

      const matchingGoals = goalRows.filter((g) =>
        g.category_name === categoryName &&
        new Date(g.start_date) <= weDate &&
        new Date(g.end_date) >= wsDate
      )
      if (!matchingGoals.length) return null
      return matchingGoals.reduce((sum, g) => sum + Number(g.hours_per_week), 0)
    }

    // Build week rows
    const weekRows = weeks.map((week) => {
      const row = { week_start: week, categories: {} }
      let totalLogged = 0
      let totalGoal = 0
      let hasGoal = false

      categories.forEach((cat) => {
        const match = rows.find(
          (r) => r.week_start === week && r.category_name === cat.name
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

      // Sum goals across all weeks for this category
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
