import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function PUT(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [existing] } = await sql`SELECT * FROM weekly_goals WHERE id = ${id}`
    if (!existing || existing.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const { name, category_id, subcategory_id, tasks_per_week, hours_per_week, start_date, end_date } = await request.json()

    const { rows: [goal] } = await sql`
      UPDATE weekly_goals SET
        name = ${name?.trim() || existing.name},
        category_id = ${category_id ? Number(category_id) : existing.category_id},
        subcategory_id = ${subcategory_id !== undefined ? (subcategory_id ? Number(subcategory_id) : null) : existing.subcategory_id},
        tasks_per_week = ${tasks_per_week ? Number(tasks_per_week) : existing.tasks_per_week},
        hours_per_week = ${hours_per_week ? Number(hours_per_week) : existing.hours_per_week},
        start_date = ${start_date || existing.start_date},
        end_date = ${end_date || existing.end_date}
      WHERE id = ${id}
      RETURNING *`

    return NextResponse.json(goal)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [existing] } = await sql`SELECT * FROM weekly_goals WHERE id = ${id}`
    if (!existing || existing.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Unlink tasks but keep them
    await sql`UPDATE tasks SET goal_id = NULL WHERE goal_id = ${id}`
    await sql`DELETE FROM weekly_goals WHERE id = ${id}`
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
