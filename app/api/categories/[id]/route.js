import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function PUT(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [existing] } = await sql`SELECT * FROM categories WHERE id = ${id}`
    if (!existing || existing.user_id !== Number(user.id))
      return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const { name } = await request.json()
    if (!name || !name.trim()) return NextResponse.json({ message: 'Name is required' }, { status: 400 })

    const { rows: [category] } = await sql`
      UPDATE categories SET name = ${name.trim()} WHERE id = ${id} RETURNING *`
    return NextResponse.json(category)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [existing] } = await sql`SELECT * FROM categories WHERE id = ${id}`
    if (!existing || existing.user_id !== Number(user.id))
      return NextResponse.json({ message: 'Not found' }, { status: 404 })

    await sql`DELETE FROM categories WHERE id = ${id}`
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
