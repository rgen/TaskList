import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { name, color } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    const trimmed = name.trim()
    if (['pending', 'completed'].includes(trimmed.toLowerCase())) {
      return NextResponse.json({ message: `"${trimmed}" is a built-in status` }, { status: 400 })
    }

    const { rows: [updated] } = await sql`
      UPDATE custom_statuses SET name = ${trimmed}, color = ${color || '#6b7280'}
      WHERE id = ${Number(id)} RETURNING *`
    if (!updated) return NextResponse.json({ message: 'Status not found' }, { status: 404 })

    return NextResponse.json(updated)
  } catch (e) {
    if (e.code === '23505') {
      return NextResponse.json({ message: 'A status with that name already exists' }, { status: 409 })
    }
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const { rows: [status] } = await sql`SELECT id FROM custom_statuses WHERE id = ${id}`
    if (!status) {
      return NextResponse.json({ message: 'Status not found' }, { status: 404 })
    }

    await sql`DELETE FROM custom_statuses WHERE id = ${id}`
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
