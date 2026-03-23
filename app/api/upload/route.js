import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file) return NextResponse.json({ message: 'No file provided' }, { status: 400 })

    const blob = await put(`attachments/${user.id}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url, label: file.name })
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
