import { jwtVerify } from 'jose'
import { sql } from '@/lib/db'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'tasklist-secret-key')

export async function getUser(request) {
  let realUser = null

  // 1. Try Authorization: Bearer <api_key>
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.slice(7)
    try {
      const { rows } = await sql`
        SELECT u.id, u.username, u.user_type FROM users u
        JOIN api_keys ak ON ak.user_id = u.id
        WHERE ak.key = ${apiKey}`
      if (rows.length > 0) realUser = rows[0]
    } catch {}
  }

  // 2. Try JWT cookie
  if (!realUser) {
    const token = request.cookies.get('auth_token')?.value
    if (!token) return null
    try {
      const { payload } = await jwtVerify(token, secret)
      // Fetch fresh user data to get user_type
      const { rows } = await sql`SELECT id, username, user_type FROM users WHERE id = ${payload.id}`
      if (rows.length > 0) realUser = rows[0]
      else return null
    } catch {
      return null
    }
  }

  // 3. Check for user switching (admin only)
  const switchedUserId = request.cookies.get('switched_user_id')?.value
  if (switchedUserId && realUser.user_type === 'admin') {
    try {
      const { rows } = await sql`SELECT id, username, user_type FROM users WHERE id = ${Number(switchedUserId)}`
      if (rows.length > 0) {
        return { ...rows[0], switched_by: realUser.id, real_user_type: 'admin' }
      }
    } catch {}
  }

  return realUser
}
