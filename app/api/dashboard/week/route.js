import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = Number(user.id)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const date = d.toISOString().slice(0, 10)
      const day = d.toLocaleDateString('en-US', { weekday: 'short' })
      const { rows: [{ count }] } = await sql`SELECT COUNT(*) FROM tasks WHERE due_date = ${date} AND user_id = ${userId} AND status != 'archived'`
      days.push({ date, day, count: +count })
    }
    return NextResponse.json(days)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
