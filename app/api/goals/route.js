import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { generateTasksForWeek, getSundayOfWeek } from '@/lib/goals'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { rows } = await sql`
      SELECT wg.*, c.name AS category_name, sc.name AS subcategory_name
      FROM weekly_goals wg
      LEFT JOIN categories c ON c.id = wg.category_id
      LEFT JOIN subcategories sc ON sc.id = wg.subcategory_id
      WHERE wg.user_id = ${Number(user.id)}
      ORDER BY wg.created_at DESC`
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { name, category_id, subcategory_id, tasks_per_week, hours_per_week, start_date, end_date } = await request.json()

    if (!name?.trim()) return NextResponse.json({ message: 'name is required' }, { status: 400 })
    if (!category_id) return NextResponse.json({ message: 'category is required' }, { status: 400 })
    if (!start_date || !end_date) return NextResponse.json({ message: 'start_date and end_date are required' }, { status: 400 })
    if (!hours_per_week || Number(hours_per_week) <= 0) return NextResponse.json({ message: 'hours_per_week must be > 0' }, { status: 400 })

    const userId = Number(user.id)
    const tpw = Number(tasks_per_week) || 1
    const hpw = Number(hours_per_week)

    const { rows: [goal] } = await sql`
      INSERT INTO weekly_goals (user_id, name, category_id, subcategory_id, tasks_per_week, hours_per_week, start_date, end_date)
      VALUES (${userId}, ${name.trim()}, ${Number(category_id)}, ${subcategory_id ? Number(subcategory_id) : null}, ${tpw}, ${hpw}, ${start_date}, ${end_date})
      RETURNING *`

    // Only generate tasks for the current week
    const currentWeekStart = getSundayOfWeek(new Date().toISOString().slice(0, 10))
    const goalWeekStart = getSundayOfWeek(start_date)

    // Use whichever is later: the goal start week or the current week
    const weekToGenerate = goalWeekStart >= currentWeekStart ? goalWeekStart : currentWeekStart

    await generateTasksForWeek(goal, weekToGenerate, userId)

    return NextResponse.json(goal, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
