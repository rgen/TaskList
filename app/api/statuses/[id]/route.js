import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const status = db.prepare('SELECT * FROM custom_statuses WHERE id = ?').get(id)
    if (!status) {
      return NextResponse.json({ message: 'Status not found' }, { status: 404 })
    }

    db.prepare('DELETE FROM custom_statuses WHERE id = ?').run(id)
    return new Response(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
