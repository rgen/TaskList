import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const statuses = db.prepare('SELECT * FROM custom_statuses ORDER BY id ASC').all()
    return NextResponse.json(statuses)
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, color } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    const trimmed = name.trim()

    if (['pending', 'completed'].includes(trimmed.toLowerCase())) {
      return NextResponse.json(
        { message: `"${trimmed}" is a built-in status and cannot be added` },
        { status: 400 }
      )
    }

    try {
      const info = db.prepare(
        'INSERT INTO custom_statuses (name, color) VALUES (?, ?)'
      ).run(trimmed, color || '#6b7280')

      const created = db.prepare('SELECT * FROM custom_statuses WHERE id = ?').get(info.lastInsertRowid)
      return NextResponse.json(created, { status: 201 })
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { message: 'A status with that name already exists' },
          { status: 409 }
        )
      }
      throw dbErr
    }
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
