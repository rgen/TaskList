import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { listCalendars, ensureGcalTable } from '@/lib/gcal'
import { sql } from '@/lib/db'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await ensureGcalTable()
    const calendars = await listCalendars(Number(user.id))
    return NextResponse.json({ calendars })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function PUT(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { calendarId, calendarName } = await request.json()
    if (!calendarId) {
      return NextResponse.json({ message: 'calendarId is required' }, { status: 400 })
    }

    await sql`
      UPDATE google_calendar_connections SET
        selected_calendar_id = ${calendarId},
        selected_calendar_name = ${calendarName || calendarId},
        updated_at = NOW()
      WHERE user_id = ${Number(user.id)}`

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
