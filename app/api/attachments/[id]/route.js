import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id)
    if (!attachment) {
      return NextResponse.json({ message: 'Attachment not found' }, { status: 404 })
    }

    db.prepare('DELETE FROM attachments WHERE id = ?').run(id)
    return new Response(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
