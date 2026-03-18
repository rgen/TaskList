import { jwtVerify } from 'jose'
import { sql } from '@vercel/postgres'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'tasklist-secret-key')

export async function getUser(request) {
  // 1. Try Authorization: Bearer <api_key>
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.slice(7)
    try {
      const { rows } = await sql`
        SELECT u.id, u.username FROM users u
        JOIN api_keys ak ON ak.user_id = u.id
        WHERE ak.key = ${apiKey}`
      if (rows.length > 0) return rows[0]
    } catch {}
  }

  // 2. Try JWT cookie
  const token = request.cookies.get('auth_token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}
