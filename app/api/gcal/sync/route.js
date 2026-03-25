import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getConnection, createEvent, updateEvent, deleteEvent } from '@/lib/gcal'

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = await request.json()
    const userId = Number(user.id)

    // Verify task ownership
    const { rows: [task] } = await sql`SELECT * FROM tasks WHERE id = ${taskId} AND user_id = ${userId}`
    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 })

    // Check connection
    const conn = await getConnection(userId)
    if (!conn) return NextResponse.json({ message: 'Google Calendar not connected' }, { status: 400 })
    if (!conn.selected_calendar_id) return NextResponse.json({ message: 'No calendar selected. Go to Customization > Google Calendar to pick one.' }, { status: 400 })

    if (!task.due_date) {
      return NextResponse.json({ message: 'Task must have a due date to sync' }, { status: 400 })
    }

    let eventId = task.gcal_event_id

    if (eventId) {
      // Update existing event
      await updateEvent(userId, task, conn.selected_calendar_id, eventId)
    } else {
      // Create new event
      eventId = await createEvent(userId, task, conn.selected_calendar_id)
      await sql`UPDATE tasks SET gcal_event_id = ${eventId} WHERE id = ${taskId}`
    }

    return NextResponse.json({ success: true, gcal_event_id: eventId })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

// Unsync: remove event from Google Calendar
export async function DELETE(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const userId = Number(user.id)

    const { rows: [task] } = await sql`SELECT * FROM tasks WHERE id = ${taskId} AND user_id = ${userId}`
    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 })

    if (task.gcal_event_id) {
      const conn = await getConnection(userId)
      if (conn?.selected_calendar_id) {
        await deleteEvent(userId, conn.selected_calendar_id, task.gcal_event_id)
      }
      await sql`UPDATE tasks SET gcal_event_id = NULL WHERE id = ${taskId}`
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
