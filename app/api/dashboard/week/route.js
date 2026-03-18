import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const date = d.toISOString().slice(0, 10)
      const day = d.toLocaleDateString('en-US', { weekday: 'short' })
      const { rows: [{ count }] } = await sql`SELECT COUNT(*) FROM tasks WHERE due_date = ${date}`
      days.push({ date, day, count: +count })
    }
    return NextResponse.json(days)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
