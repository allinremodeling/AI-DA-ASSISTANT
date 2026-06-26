/** URL where Supabase sends users after email confirmation (must be allowlisted in Supabase Auth). */
export function getAuthRedirectUrl(): string {
  const explicit = import.meta.env.VITE_AUTH_REDIRECT_URL
  if (explicit && typeof explicit === 'string' && explicit.startsWith('http')) {
    return explicit.endsWith('/') ? explicit : `${explicit}/`
  }

  const base = import.meta.env.BASE_URL || '/'
  const path = base.startsWith('/') ? base : `/${base}`
  const normalized = path.endsWith('/') ? path : `${path}/`
  return `${window.location.origin}${normalized}`
}
