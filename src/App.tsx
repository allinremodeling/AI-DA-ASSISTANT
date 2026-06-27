import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { getAuthRedirectUrl } from './lib/authRedirect'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ChatInterface } from './components/ChatInterface'
import LoginPage from './components/LoginPage'

const supabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) return

    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) console.error('Auth email confirmation failed:', error.message)
        window.history.replaceState({}, '', getAuthRedirectUrl())
      }

      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session) setShowLogin(false)
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setShowLogin(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (session) {
    return (
      <div className="h-screen w-screen bg-white text-[#111111] overflow-hidden">
        <ErrorBoundary>
          <ChatInterface mode="authenticated" onLogout={() => supabase.auth.signOut()} />
        </ErrorBoundary>
      </div>
    )
  }

  if (showLogin && supabaseConfigured) {
    return (
      <div className="min-h-screen w-screen bg-white text-[#111111] overflow-y-auto">
        <LoginPage
          onGuest={() => setShowLogin(false)}
          onBack={() => setShowLogin(false)}
        />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-white text-[#111111] overflow-hidden">
      <ErrorBoundary>
        <ChatInterface
          mode="guest"
          onSignIn={supabaseConfigured ? () => setShowLogin(true) : undefined}
        />
      </ErrorBoundary>
    </div>
  )
}
