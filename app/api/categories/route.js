import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { rows: categories } = await sql`
      SELECT * FROM categories WHERE user_id = ${Number(user.id)} ORDER BY name`
    const { rows: subcategories } = await sql`
      SELECT * FROM subcategories WHERE user_id = ${Number(user.id)} ORDER BY name`

    const result = categories.map((cat) => ({
      ...cat,
      subcategories: subcategories.filter((s) => s.category_id === cat.id),
    }))

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { name } = await request.json()
    if (!name || !name.trim()) return NextResponse.json({ message: 'Name is required' }, { status: 400 })

    const { rows: [category] } = await sql`
      INSERT INTO categories (user_id, name) VALUES (${Number(user.id)}, ${name.trim()}) RETURNING *`

    return NextResponse.json({ ...category, subcategories: [] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
