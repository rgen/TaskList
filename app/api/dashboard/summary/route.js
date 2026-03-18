import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count
    const completed = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count
    const pending = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count
    const overdue = db.prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < ?"
    ).get(today).count

    const high = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'high'").get().count
    const medium = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'medium'").get().count
    const low = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'low'").get().count

    return NextResponse.json({
      total,
      completed,
      pending,
      overdue,
      byPriority: { high, medium, low },
    })
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
