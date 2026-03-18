import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getUser } from '@/lib/auth'
import { randomBytes } from 'crypto'

// GET — return existing key (or null)
export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { rows } = await sql`SELECT key FROM api_keys WHERE user_id = ${user.id}`
  return NextResponse.json({ apiKey: rows[0]?.key || null })
}

// POST — generate new key (replaces existing)
export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const key = 'tl_' + randomBytes(32).toString('hex')
  await sql`DELETE FROM api_keys WHERE user_id = ${user.id}`
  await sql`INSERT INTO api_keys (user_id, key) VALUES (${user.id}, ${key})`
  return NextResponse.json({ apiKey: key })
}
