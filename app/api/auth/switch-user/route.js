import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const userType = user.real_user_type || user.user_type
  if (userType !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const { userId } = await request.json()

  // Clear switch (go back to own account)
  if (!userId) {
    const response = NextResponse.json({ message: 'Switched back' })
    response.cookies.set('switched_user_id', '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' })
    return response
  }

  // Verify target user exists
  const { rows } = await sql`SELECT id, username FROM users WHERE id = ${userId}`
  if (rows.length === 0) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  const response = NextResponse.json({ message: 'Switched', username: rows[0].username })
  response.cookies.set('switched_user_id', String(userId), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return response
}
