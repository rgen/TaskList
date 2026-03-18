import { NextResponse } from 'next/server'
import db from '@/lib/db'

function toBoolean(val) {
  return val === 1 || val === true
}

function addIsOverdue(task) {
  const today = new Date().toISOString().slice(0, 10)
  task.is_overdue =
    task.due_date !== null &&
    task.due_date !== undefined &&
    task.due_date < today &&
    task.status === 'pending'
  return task
}

export async function GET(request, { params }) {
  try {
    const { id } = params
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(task.id)
    const attachments = db.prepare('SELECT * FROM attachments WHERE task_id = ?').all(task.id)

    subtasks.forEach(s => { s.completed = toBoolean(s.completed) })

    addIsOverdue(task)
    task.subtasks = subtasks
    task.attachments = attachments

    return NextResponse.json(task)
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    if (!existing) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, notes, status, priority, due_date, duration } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    let completed_at = existing.completed_at
    if (status === 'completed' && existing.status !== 'completed') {
      completed_at = new Date().toISOString()
    } else if (status === 'pending') {
      completed_at = null
    }

    db.prepare(`
      UPDATE tasks
      SET name = ?, notes = ?, status = ?, priority = ?, due_date = ?, duration = ?,
          completed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name.trim(),
      notes || null,
      status || existing.status,
      priority || existing.priority,
      due_date || null,
      duration || null,
      completed_at,
      id
    )

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(task.id)
    const attachments = db.prepare('SELECT * FROM attachments WHERE task_id = ?').all(task.id)

    subtasks.forEach(s => { s.completed = toBoolean(s.completed) })
    addIsOverdue(task)
    task.subtasks = subtasks
    task.attachments = attachments

    return NextResponse.json(task)
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
    return new Response(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
