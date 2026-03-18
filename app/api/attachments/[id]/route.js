import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const { rows: [attachment] } = await sql`SELECT id FROM attachments WHERE id = ${id}`
    if (!attachment) {
      return NextResponse.json({ message: 'Attachment not found' }, { status: 404 })
    }

    await sql`DELETE FROM attachments WHERE id = ${id}`
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
