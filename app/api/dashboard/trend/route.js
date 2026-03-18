import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT TO_CHAR(completed_at, 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM tasks
      WHERE completed_at IS NOT NULL AND completed_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(completed_at, 'YYYY-MM-DD')
      ORDER BY date ASC`

    const map = {}
    rows.forEach(r => { map[r.date] = +r.count })

    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      result.push({ date, count: map[date] || 0 })
    }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
