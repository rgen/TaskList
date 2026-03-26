import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = Number(user.id)
    // Disable Gmail import and clear Gmail-specific fields, but keep the Google Calendar connection
    await sql`
      UPDATE google_calendar_connections SET
        gmail_enabled = FALSE,
        gmail_label_id = NULL,
        updated_at = NOW()
      WHERE user_id = ${userId}`

    // Clear gmail_message_id references from tasks
    await sql`UPDATE tasks SET gmail_message_id = NULL WHERE user_id = ${userId}`

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
