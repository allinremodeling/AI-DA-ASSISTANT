import { useState } from 'react'
import { Loader2, Phone, Sparkles, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getAuthRedirectUrl } from '../lib/authRedirect'
import { cn } from '../lib/utils'
import { BRAND, BRAND_COLORS, ECOSYSTEM } from '../lib/brand'
import { BrandHeader } from './BrandMark'

const inputClass =
  'w-full px-4 py-3.5 bg-white border border-[#d4d4d4] rounded-xl text-sm text-[#111111] placeholder-[#767676] shadow-sm transition-all focus:outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20'

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (lower.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión (revisa tu bandeja).'
  if (lower.includes('user already registered')) return 'Este correo ya está registrado. Inicia sesión.'
  if (lower.includes('password') && lower.includes('6')) return 'La contraseña debe tener al menos 6 caracteres.'
  return message
}

export default function LoginPage({
  onGuest,
  onBack,
}: {
  onGuest?: () => void
  onBack?: () => void
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(friendlyAuthError(signInError.message))
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      })
      if (signUpError) setError(friendlyAuthError(signUpError.message))
      else setSuccess('Revisa tu correo para confirmar tu cuenta.')
    }

    setLoading(false)
  }

  return (
    <div className="login-shell min-h-screen w-full flex items-center justify-center px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-[420px]">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 text-sm text-[#666] hover:text-[#111111] flex items-center gap-1"
          >
            ← Volver a consulta express
          </button>
        )}

        <div className="login-card rounded-2xl border border-[#e5e5e5] bg-white/95 backdrop-blur-sm shadow-xl shadow-black/[0.06] px-6 py-8 sm:px-8 sm:py-9">
          <BrandHeader />

          <form onSubmit={handleSubmit} className="space-y-3.5 mt-8">
            <div>
              <label htmlFor="email" className="sr-only">Correo electrónico</label>
              <input
                id="email"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                loading
                  ? 'bg-[#e5e5e5] text-[#999999] cursor-not-allowed'
                  : 'text-white hover:opacity-95 active:scale-[0.99] shadow-md shadow-black/10',
              )}
              style={loading ? undefined : { backgroundColor: BRAND_COLORS.primary }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          {onGuest && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#ececec]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#999]">o prueba gratis</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onGuest}
                className="group w-full py-3.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 hover:bg-[#fff7f2] active:scale-[0.99]"
                style={{ borderColor: BRAND_COLORS.accent, color: BRAND_COLORS.primary }}
              >
                <Sparkles className="w-4 h-4" style={{ color: BRAND_COLORS.accent }} />
                Consulta express sin cuenta
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: BRAND_COLORS.accent }} />
              </button>
            </>
          )}

          <p className="text-center text-sm text-[#555] mt-6">
            {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: BRAND_COLORS.accent }}
            >
              {mode === 'signin' ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </p>
        </div>

        <footer className="mt-6 flex flex-col items-center gap-3">
          <a
            href={`tel:${BRAND.phoneRaw}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#444] hover:text-[#0a0a0a] transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#e5e5e5] shadow-sm">
              <Phone className="w-3.5 h-3.5" style={{ color: BRAND_COLORS.accent }} />
            </span>
            {BRAND.phone}
          </a>

          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-xs text-[#666]">
            {[
              { label: 'allinremodeling.us', href: ECOSYSTEM.remodeling.url },
              { label: 'allinbuilders.us', href: ECOSYSTEM.builders.url },
              { label: 'smartslab.app', href: ECOSYSTEM.smartslab.url },
            ].map((link, i) => (
              <span key={link.href} className="inline-flex items-center gap-1">
                {i > 0 && <span className="text-[#ccc] px-1">·</span>}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#e85d04] underline-offset-2 hover:underline transition-colors"
                >
                  {link.label}
                </a>
              </span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}
