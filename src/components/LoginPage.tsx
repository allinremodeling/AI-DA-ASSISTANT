import { useState } from 'react'
import { Loader2, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { BRAND, BRAND_COLORS } from '../lib/brand'
import { BrandHeader } from './BrandMark'

export default function LoginPage({ onGuest }: { onGuest?: () => void }) {
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
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Revisa tu correo para confirmar tu cuenta.')
    }

    setLoading(false)
  }

  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <BrandHeader />

        <form onSubmit={handleSubmit} className="space-y-3 mt-8">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-[#f9f9f9] border border-[#e5e5e5] rounded-xl text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#b8952f] transition-colors"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-[#f9f9f9] border border-[#e5e5e5] rounded-xl text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#b8952f] transition-colors"
          />

          {error && <p className="text-xs text-red-500 px-1">{error}</p>}
          {success && <p className="text-xs text-green-600 px-1">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2',
              loading
                ? 'bg-[#e5e5e5] text-[#999999] cursor-not-allowed'
                : 'text-white hover:opacity-90',
            )}
            style={loading ? undefined : { backgroundColor: BRAND_COLORS.primary }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        {onGuest && (
          <button
            type="button"
            onClick={onGuest}
            className="w-full mt-3 py-3 rounded-xl text-sm font-medium border transition-colors hover:bg-[#faf8f3]"
            style={{ borderColor: BRAND_COLORS.accent, color: BRAND_COLORS.primary }}
          >
            Consulta express sin cuenta
          </button>
        )}

        <div className="mt-6 flex flex-col items-center gap-2 text-xs" style={{ color: BRAND_COLORS.muted }}>
          <a href={`tel:${BRAND.phoneRaw}`} className="inline-flex items-center gap-1 hover:text-[#1a1a1a]">
            <Phone className="w-3 h-3" />
            {BRAND.phone}
          </a>
          <a href={BRAND.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#1a1a1a]">
            {BRAND.website.replace('https://', '')}
          </a>
        </div>

        <p className="text-center text-xs text-[#6b6b6b] mt-6">
          {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}
            className="font-medium underline underline-offset-2"
            style={{ color: BRAND_COLORS.accent }}
          >
            {mode === 'signin' ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}
