import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = Number(user.id)
    await sql`DELETE FROM google_calendar_connections WHERE user_id = ${userId}`
    await sql`UPDATE tasks SET gcal_event_id = NULL WHERE user_id = ${userId}`
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
