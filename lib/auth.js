import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'tasklist-secret-key')

export async function getUser(request) {
  const token = request.cookies.get('auth_token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload // { id, username }
  } catch {
    return null
  }
}
