const PRODUCTION_AUTH_REDIRECT = 'https://allinremodeling.us/ai/'

function normalizeRedirectUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

/** URL where Supabase sends users after email confirmation (must be allowlisted in Supabase Auth). */
export function getAuthRedirectUrl(): string {
  const explicit = import.meta.env.VITE_AUTH_REDIRECT_URL
  if (explicit && typeof explicit === 'string' && explicit.startsWith('http')) {
    return normalizeRedirectUrl(explicit)
  }

  const base = import.meta.env.BASE_URL || '/'
  if (import.meta.env.PROD && (base === '/ai/' || base === '/ai')) {
    return PRODUCTION_AUTH_REDIRECT
  }

  const path = base.startsWith('/') ? base : `/${base}`
  return normalizeRedirectUrl(`${window.location.origin}${path}`)
}
