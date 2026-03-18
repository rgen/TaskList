import { NextResponse } from 'next/server'
import db from '@/lib/db'

function addIsOverdue(task) {
  const today = new Date().toISOString().slice(0, 10)
  task.is_overdue =
    task.due_date !== null &&
    task.due_date !== undefined &&
    task.due_date < today &&
    task.status === 'pending'
  return task
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const newStatus = task.status === 'pending' ? 'completed' : 'pending'
    const completed_at = newStatus === 'completed' ? new Date().toISOString() : null

    db.prepare(`
      UPDATE tasks
      SET status = ?, completed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, completed_at, task.id)

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id)
    addIsOverdue(updated)
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
