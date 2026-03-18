import { NextResponse } from 'next/server'
import db from '@/lib/db'

function toBoolean(val) {
  return val === 1 || val === true
}

export async function GET(request, { params }) {
  try {
    const { id } = params
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id)
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(id)
    subtasks.forEach(s => { s.completed = toBoolean(s.completed) })
    return NextResponse.json(subtasks)
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id)
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name } = body
    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    const info = db.prepare(
      'INSERT INTO subtasks (task_id, name, completed) VALUES (?, ?, 0)'
    ).run(id, name.trim())

    const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(info.lastInsertRowid)
    subtask.completed = toBoolean(subtask.completed)
    return NextResponse.json(subtask, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
