import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const rows = db.prepare(`
      SELECT date(completed_at) as date, COUNT(*) as count
      FROM tasks
      WHERE completed_at IS NOT NULL
        AND completed_at >= datetime('now', '-30 days')
      GROUP BY date(completed_at)
      ORDER BY date ASC
    `).all()

    const map = {}
    rows.forEach(r => { map[r.date] = r.count })

    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      result.push({ date, count: map[date] || 0 })
    }

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
