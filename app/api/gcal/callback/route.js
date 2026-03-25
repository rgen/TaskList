import { NextResponse } from 'next/server'
import { verifyState, getTokensFromCode, saveTokens, ensureGcalTable } from '@/lib/gcal'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/customization/google-calendar?error=denied', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/customization/google-calendar?error=missing_params', request.url))
  }

  try {
    await ensureGcalTable()
    const userId = await verifyState(state)
    const tokens = await getTokensFromCode(code)
    await saveTokens(userId, tokens)
    return NextResponse.redirect(new URL('/customization/google-calendar?connected=true', request.url))
  } catch (e) {
    return NextResponse.redirect(new URL(`/customization/google-calendar?error=${encodeURIComponent(e.message)}`, request.url))
  }
}
