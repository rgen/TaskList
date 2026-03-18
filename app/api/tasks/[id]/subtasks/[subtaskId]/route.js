import { NextResponse } from 'next/server'
import db from '@/lib/db'

function toBoolean(val) {
  return val === 1 || val === true
}

export async function PUT(request, { params }) {
  try {
    const { id, subtaskId } = params
    const subtask = db.prepare(
      'SELECT * FROM subtasks WHERE id = ? AND task_id = ?'
    ).get(subtaskId, id)

    if (!subtask) {
      return NextResponse.json({ message: 'Subtask not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, completed } = body
    const newName = name !== undefined ? name.trim() : subtask.name
    const newCompleted = completed !== undefined ? (completed ? 1 : 0) : subtask.completed

    db.prepare(
      'UPDATE subtasks SET name = ?, completed = ? WHERE id = ?'
    ).run(newName, newCompleted, subtask.id)

    const updated = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtask.id)
    updated.completed = toBoolean(updated.completed)
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id, subtaskId } = params
    const subtask = db.prepare(
      'SELECT * FROM subtasks WHERE id = ? AND task_id = ?'
    ).get(subtaskId, id)

    if (!subtask) {
      return NextResponse.json({ message: 'Subtask not found' }, { status: 404 })
    }

    db.prepare('DELETE FROM subtasks WHERE id = ?').run(subtask.id)
    return new Response(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
