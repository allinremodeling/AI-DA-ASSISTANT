import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { ChatInterface } from './components/ChatInterface'
import LoginPage from './components/LoginPage'

const supabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!supabaseConfigured) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold text-[#111111]">Configuración incompleta</h1>
          <p className="text-sm text-neutral-600">
            Faltan las variables de entorno de Supabase en el build de producción:
            <code className="block mt-2 text-xs">VITE_SUPABASE_URL</code>
            <code className="block text-xs">VITE_SUPABASE_ANON_KEY</code>
          </p>
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
    <div className="h-screen w-screen bg-white text-[#111111]">
      {session
        ? <ChatInterface onLogout={() => supabase.auth.signOut()} />
        : <LoginPage />
      }
    </div>
  )
}
