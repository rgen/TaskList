import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

function addIsOverdue(task) {
  const today = new Date().toISOString().slice(0, 10)
  task.is_overdue =
    task.due_date !== null &&
    task.due_date !== undefined &&
    task.due_date < today &&
    task.status !== 'completed'
  return task
}

export async function PATCH(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [task] } = await sql`SELECT * FROM tasks WHERE id = ${id}`
    if (!task || task.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null

    const { rows: [updated] } = await sql`
      UPDATE tasks SET status = ${newStatus}, completed_at = ${completedAt}, updated_at = NOW()
      WHERE id = ${id} RETURNING *`

    addIsOverdue(updated)
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
