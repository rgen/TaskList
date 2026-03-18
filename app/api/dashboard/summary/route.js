import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { rows: [{ count: total }] } = await sql`SELECT COUNT(*) FROM tasks`
    const { rows: [{ count: completed }] } = await sql`SELECT COUNT(*) FROM tasks WHERE status = 'completed'`
    const { rows: [{ count: pending }] } = await sql`SELECT COUNT(*) FROM tasks WHERE status != 'completed'`
    const { rows: [{ count: overdue }] } = await sql`SELECT COUNT(*) FROM tasks WHERE due_date < CURRENT_DATE::text AND status != 'completed'`
    const { rows: [{ count: high }] } = await sql`SELECT COUNT(*) FROM tasks WHERE priority = 'high'`
    const { rows: [{ count: medium }] } = await sql`SELECT COUNT(*) FROM tasks WHERE priority = 'medium'`
    const { rows: [{ count: low }] } = await sql`SELECT COUNT(*) FROM tasks WHERE priority = 'low'`

    return NextResponse.json({
      total: +total,
      completed: +completed,
      pending: +pending,
      overdue: +overdue,
      byPriority: { high: +high, medium: +medium, low: +low },
    })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
