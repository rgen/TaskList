import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const { id } = params
    const { rows: [task] } = await sql`SELECT id FROM tasks WHERE id = ${id}`
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
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
