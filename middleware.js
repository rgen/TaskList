import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'tasklist-secret-key')

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/api/auth')

  if (isPublic) return NextResponse.next()

  const token = request.cookies.get('auth_token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', request.url))

  try {
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
