import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { rows: [task] } = await sql`SELECT id FROM tasks WHERE id = ${id}`
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const { rows: subtasks } = await sql`SELECT * FROM subtasks WHERE task_id = ${id} ORDER BY id`
    return NextResponse.json(subtasks)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params
    const { rows: [task] } = await sql`SELECT id FROM tasks WHERE id = ${id}`
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name } = body
    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    const { rows: [subtask] } = await sql`
      INSERT INTO subtasks (task_id, name, completed) VALUES (${id}, ${name.trim()}, false)
      RETURNING *`
    return NextResponse.json(subtask, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
