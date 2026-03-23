import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

const RECOVERY_CODE = '1981'

export async function POST(request) {
  try {
    const { username, code, newPassword } = await request.json()
    if (code !== RECOVERY_CODE) return NextResponse.json({ message: 'Invalid recovery code' }, { status: 401 })
    if (!username || !newPassword) return NextResponse.json({ message: 'Username and new password required' }, { status: 400 })

    const { rows } = await sql`SELECT id FROM users WHERE username = ${username}`
    if (rows.length === 0) return NextResponse.json({ message: 'Username not found' }, { status: 404 })

    const hashed = await bcrypt.hash(newPassword, 10)
    await sql`UPDATE users SET password = ${hashed} WHERE username = ${username}`

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
