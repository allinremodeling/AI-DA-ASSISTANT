import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { ChatInterface } from './components/ChatInterface'
import LoginPage from './components/LoginPage'
import { cn } from './lib/utils'

const GUEST_KEY = 'allin_ai_guest_mode'

const supabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestMode, setGuestMode] = useState(() => sessionStorage.getItem(GUEST_KEY) === '1')

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        sessionStorage.removeItem(GUEST_KEY)
        setGuestMode(false)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        sessionStorage.removeItem(GUEST_KEY)
        setGuestMode(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const startGuestMode = () => {
    sessionStorage.setItem(GUEST_KEY, '1')
    setGuestMode(true)
  }

  const exitGuestMode = () => {
    sessionStorage.removeItem(GUEST_KEY)
    setGuestMode(false)
  }

  if (!supabaseConfigured && !guestMode) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-[#111111]">All In AI</h1>
          <p className="text-sm text-neutral-600">
            Supabase no está configurado. Puedes probar una consulta express como invitado.
          </p>
          <button
            onClick={startGuestMode}
            className="px-4 py-2 rounded-xl bg-[#111111] text-white text-sm hover:bg-[#333333]"
          >
            Consulta express
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn(
      'min-h-screen w-screen bg-white text-[#111111]',
      session || guestMode ? 'h-screen overflow-hidden' : 'overflow-y-auto',
    )}>
      {session ? (
        <ChatInterface mode="authenticated" onLogout={() => supabase.auth.signOut()} />
      ) : guestMode ? (
        <ChatInterface mode="guest" onSignIn={exitGuestMode} />
      ) : (
        <LoginPage onGuest={startGuestMode} />
      )}
    </div>
  )
}
