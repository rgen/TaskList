import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function PUT(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id: taskId } = params
    const { rows: [task] } = await sql`SELECT user_id FROM tasks WHERE id = ${taskId}`
    if (!task || task.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const { orderedIds } = await request.json()
    await Promise.all(
      orderedIds.map((id, index) =>
        sql`UPDATE subtasks SET position = ${index} WHERE id = ${id} AND task_id = ${taskId}`
      )
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
