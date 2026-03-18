import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [attachment] } = await sql`
      SELECT a.id FROM attachments a
      JOIN tasks t ON t.id = a.task_id
      WHERE a.id = ${id} AND t.user_id = ${Number(user.id)}`
    if (!attachment) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    await sql`DELETE FROM attachments WHERE id = ${id}`
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
