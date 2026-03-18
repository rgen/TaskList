import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const { id, subtaskId } = params
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
  try {
    const { id, subtaskId } = params
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
