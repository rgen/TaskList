import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function POST(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [task] } = await sql`SELECT user_id FROM tasks WHERE id = ${id}`
    if (!task || task.user_id !== Number(user.id)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { label, url } = body
    if (!url || url.trim() === '') {
      return NextResponse.json({ message: 'url is required' }, { status: 400 })
    }

    const { rows: [attachment] } = await sql`
      INSERT INTO attachments (task_id, label, url) VALUES (${id}, ${label || null}, ${url.trim()})
      RETURNING *`
    return NextResponse.json(attachment, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
