import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM custom_statuses ORDER BY id`
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
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
      const { rows: [created] } = await sql`
        INSERT INTO custom_statuses (name, color) VALUES (${trimmed}, ${color || '#6b7280'})
        RETURNING *`
      return NextResponse.json(created, { status: 201 })
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return NextResponse.json(
          { message: 'A status with that name already exists' },
          { status: 409 }
        )
      }
      throw dbErr
    }
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
