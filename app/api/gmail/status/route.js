import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { ensureGcalTable } from '@/lib/gcal'
import { getGmailStatus } from '@/lib/gmail'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await ensureGcalTable()
    const status = await getGmailStatus(Number(user.id))
    return NextResponse.json(status)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
