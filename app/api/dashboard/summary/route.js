import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = Number(user.id)
    const { rows: [{ count: total }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId}`
    const { rows: [{ count: completed }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND status = 'completed'`
    const { rows: [{ count: pending }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND status != 'completed'`
    const { rows: [{ count: overdue }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND due_date < CURRENT_DATE::text AND status != 'completed'`
    const { rows: [{ count: high }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND priority = 'high'`
    const { rows: [{ count: medium }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND priority = 'medium'`
    const { rows: [{ count: low }] } = await sql`SELECT COUNT(*) FROM tasks WHERE user_id = ${userId} AND priority = 'low'`

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
