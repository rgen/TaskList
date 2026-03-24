import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function POST(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = params
    const { rows: [category] } = await sql`SELECT * FROM categories WHERE id = ${id}`
    if (!category || category.user_id !== Number(user.id))
      return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const { name } = await request.json()
    if (!name || !name.trim()) return NextResponse.json({ message: 'Name is required' }, { status: 400 })

    const { rows: [subcategory] } = await sql`
      INSERT INTO subcategories (user_id, category_id, name)
      VALUES (${Number(user.id)}, ${Number(id)}, ${name.trim()}) RETURNING *`

    return NextResponse.json(subcategory, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
