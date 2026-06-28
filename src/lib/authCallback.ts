import type { EmailOtpType } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { getAuthRedirectUrl } from './authRedirect'

const OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'email',
  'recovery',
  'invite',
  'magiclink',
  'email_change',
])

function stripAuthFromUrl(): void {
  window.history.replaceState({}, '', getAuthRedirectUrl())
}

/** Completes email confirmation / magic-link callbacks and returns to a clean app URL. */
export async function completeAuthFromUrl(): Promise<{ error?: string }> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const tokenHash = params.get('token_hash')
  const type = params.get('type')

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return { error: error.message }
    stripAuthFromUrl()
    return {}
  }

  if (tokenHash && type && OTP_TYPES.has(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })
    if (error) return { error: error.message }
    stripAuthFromUrl()
    return {}
  }

  const hash = window.location.hash
  if (hash.includes('access_token') || hash.includes('refresh_token')) {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) return { error: error.message }
    if (session) stripAuthFromUrl()
  }

  return {}
}
