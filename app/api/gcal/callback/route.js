import { NextResponse } from 'next/server'
import { verifyState, getTokensFromCode, saveTokens, ensureGcalTable } from '@/lib/gcal'
import { ensureGmailLabel } from '@/lib/gmail'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const scope = searchParams.get('scope')

  if (error) {
    return NextResponse.redirect(new URL('/customization/google-calendar?error=denied', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/customization/google-calendar?error=missing_params', request.url))
  }

  try {
    await ensureGcalTable()
    const { userId, returnTo } = await verifyState(state)
    const tokens = await getTokensFromCode(code)
    await saveTokens(userId, tokens, scope)

    // If connecting Gmail, create the label and enable Gmail import
    if (returnTo === 'gmail') {
      try {
        await ensureGmailLabel(userId)
      } catch (e) {
        // Label creation failed but connection is still saved
        console.error('Failed to create Gmail label:', e.message)
      }
    }

    const redirectPath = returnTo === 'gmail'
      ? '/customization/gmail?connected=true'
      : '/customization/google-calendar?connected=true'

    return NextResponse.redirect(new URL(redirectPath, request.url))
  } catch (e) {
    return NextResponse.redirect(new URL(`/customization/google-calendar?error=${encodeURIComponent(e.message)}`, request.url))
  }
}
