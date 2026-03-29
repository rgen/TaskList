import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const userType = user.real_user_type || user.user_type
  if (userType !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const { rows } = await sql`SELECT id, username, user_type FROM users ORDER BY username`
  return NextResponse.json(rows)
}
