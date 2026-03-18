import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

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
