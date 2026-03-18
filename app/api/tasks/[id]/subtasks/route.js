import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id: taskId } = params
    const { rows: [task] } = await sql`SELECT user_id FROM tasks WHERE id = ${taskId}`
    if (!task || task.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const { rows: subtasks } = await sql`SELECT * FROM subtasks WHERE task_id = ${taskId} ORDER BY id`
    return NextResponse.json(subtasks)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id: taskId } = params
    const { rows: [task] } = await sql`SELECT user_id FROM tasks WHERE id = ${taskId}`
    if (!task || task.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name } = body
    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    const { rows: [subtask] } = await sql`
      INSERT INTO subtasks (task_id, name, completed) VALUES (${taskId}, ${name.trim()}, false)
      RETURNING *`
    return NextResponse.json(subtask, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
