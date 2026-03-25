import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { getAuthUrl, ensureGcalTable } from '@/lib/gcal'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    // Debug: check if env vars are set
    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({
        message: 'GOOGLE_CLIENT_ID environment variable is not set. Please add it in Vercel Settings > Environment Variables and redeploy.',
        debug: {
          hasClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
        }
      }, { status: 500 })
    }

    await ensureGcalTable()
    const url = await getAuthUrl(Number(user.id))
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
