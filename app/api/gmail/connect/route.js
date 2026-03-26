import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { getAuthUrl, ensureGcalTable } from '@/lib/gcal'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await ensureGcalTable()

    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ message: 'Google OAuth credentials not configured' }, { status: 500 })
    }

    const url = await getAuthUrl(Number(user.id), {
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
      returnTo: 'gmail',
    })

    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
