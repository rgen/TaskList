import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function PUT(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id, subtaskId } = params
    const { rows: [task] } = await sql`SELECT user_id FROM tasks WHERE id = ${id}`
    if (!task || task.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const { rows: [subtask] } = await sql`
      SELECT * FROM subtasks WHERE id = ${subtaskId} AND task_id = ${id}`

    if (!subtask) {
      return NextResponse.json({ message: 'Subtask not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, completed } = body
    const newName = name !== undefined ? name.trim() : subtask.name
    const newCompleted = completed !== undefined ? completed : subtask.completed

    const { rows: [updated] } = await sql`
      UPDATE subtasks SET name = ${newName}, completed = ${newCompleted}
      WHERE id = ${subtask.id} RETURNING *`
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id, subtaskId } = params
    const { rows: [task] } = await sql`SELECT user_id FROM tasks WHERE id = ${id}`
    if (!task || task.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const { rows: [subtask] } = await sql`
      SELECT * FROM subtasks WHERE id = ${subtaskId} AND task_id = ${id}`

    if (!subtask) {
      return NextResponse.json({ message: 'Subtask not found' }, { status: 404 })
    }

    await sql`DELETE FROM subtasks WHERE id = ${subtask.id}`
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
