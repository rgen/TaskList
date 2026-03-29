import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    id: user.id,
    username: user.username,
    user_type: user.real_user_type || user.user_type,
    is_switched: !!user.switched_by,
    switched_by: user.switched_by || null,
  })
}
