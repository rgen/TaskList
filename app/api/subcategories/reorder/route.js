import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function PUT(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { ids } = await request.json()
    await Promise.all(
      ids.map((id, index) =>
        sql`UPDATE subcategories SET position = ${index} WHERE id = ${id} AND user_id = ${Number(user.id)}`
      )
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
