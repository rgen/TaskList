import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { getConnection, ensureGcalTable } from '@/lib/gcal'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await ensureGcalTable()
    const conn = await getConnection(Number(user.id))
    return NextResponse.json({
      connected: !!conn,
      selectedCalendar: conn?.selected_calendar_id
        ? { id: conn.selected_calendar_id, name: conn.selected_calendar_name }
        : null,
    })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
