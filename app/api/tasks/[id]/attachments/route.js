import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function POST(request, { params }) {
  try {
    const { id } = params
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id)
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const { label, url } = body
    if (!url || url.trim() === '') {
      return NextResponse.json({ message: 'url is required' }, { status: 400 })
    }

    const info = db.prepare(
      'INSERT INTO attachments (task_id, label, url) VALUES (?, ?, ?)'
    ).run(id, label || null, url.trim())

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(info.lastInsertRowid)
    return NextResponse.json(attachment, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
