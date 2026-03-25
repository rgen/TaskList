import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { getAuthUrl, ensureGcalTable } from '@/lib/gcal'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await ensureGcalTable()
    const url = await getAuthUrl(Number(user.id))
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
