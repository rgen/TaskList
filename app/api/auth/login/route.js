import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'tasklist-secret-key')

export async function POST(request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) return NextResponse.json({ message: 'Username and password required' }, { status: 400 })

    const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`
    if (rows.length === 0) return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 })

    const valid = await bcrypt.compare(password, rows[0].password)
    if (!valid) return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 })

    const token = await new SignJWT({ id: rows[0].id, username: rows[0].username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    const response = NextResponse.json({ username: rows[0].username })
    response.cookies.set('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
    return response
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
