import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { importEmailsAsTasks } from '@/lib/gmail'

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const result = await importEmailsAsTasks(Number(user.id))
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
