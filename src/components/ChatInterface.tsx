import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ImagePlus,
  X,
  Loader2,
  ArrowUp,
  Sparkles,
  Trash2,
  ChevronRight,
  Menu,
  Plus,
  MessageSquare,
  Wand2,
  LogOut,
} from 'lucide-react'
import type { ChatMessage } from '../lib/types'
import { cn } from '../lib/utils'
import { sendChatMessage, getGuestMessageLimit } from '../lib/chatService'
import { createNewThread, getThreadId, setThreadId, getThreadList, saveMessages, saveThreadTitle, getMessages } from '../lib/thread'
import { AssistantMessageBody } from './DesignBlocks'
import { BRAND, BRAND_COLORS } from '../lib/brand'
import { BrandMark } from './BrandMark'

const WELCOME_AUTH = `Bienvenido al asistente AI de ${BRAND.name}.\n\nSube una foto de tu cocina o baño para análisis con Claude Vision, tendencias de diseño y referencias de nuestros proyectos reales en Georgia.`
const WELCOME_GUEST = `Consulta express gratuita · ${BRAND.tagline}\n\nSube una foto y recibe análisis visual + referencias de proyectos reales de All In Remodeling. Sin guardar historial.`

export function ChatInterface({
  mode = 'authenticated',
  onLogout,
  onSignIn,
}: {
  mode?: 'guest' | 'authenticated'
  onLogout?: () => void
  onSignIn?: () => void
}) {
  const isGuest = mode === 'guest'
  const guestLimit = getGuestMessageLimit()
  const [threadId, setThreadIdState] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [threadList, setThreadList] = useState(getThreadList())
  const [loadingText, setLoadingText] = useState('Analizando...')
  const [guestUserMessages, setGuestUserMessages] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  useEffect(() => {
    if (isGuest) {
      setThreadIdState('guest_express')
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_GUEST,
        intro: WELCOME_GUEST,
      }])
      return
    }

    const existing = getThreadId()
    if (existing) {
      setThreadIdState(existing)
      const saved = getMessages(existing)
      if (saved.length > 0) {
        setMessages(saved)
      } else {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_AUTH,
          intro: WELCOME_AUTH,
        }])
      }
    } else {
      const newThread = createNewThread()
      setThreadIdState(newThread)
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_AUTH,
        intro: WELCOME_AUTH,
      }])
    }
  }, [isGuest])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleSend = async () => {
    if (!input.trim() && !imagePreview) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim() || (imagePreview ? 'Analiza esta imagen de mi cocina' : ''),
      imageUrl: imagePreview || undefined,
    }

    const updated = [...messages, userMessage]
    setMessages(updated)
    setInput('')
    setImagePreview(null)
    setIsLoading(true)
    setLoadingText('Analizando...')

    const response = await sendChatMessage(
      threadId,
      userMessage.content,
      imagePreview || undefined,
      (status) => setLoadingText(status),
      { guest: isGuest, userMessageCount: guestUserMessages },
    )

    const final = [...updated, response]
    setMessages(final)
    if (!isGuest) {
      saveMessages(threadId, final)
    }
    if (isGuest) {
      setGuestUserMessages((c) => c + 1)
    }
    setIsLoading(false)

    if (!isGuest && final.length <= 3 && threadId) {
      const title = userMessage.content.slice(0, 40) + (userMessage.content.length > 40 ? '...' : '')
      saveThreadTitle(threadId, title)
      setThreadList(getThreadList())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    if (isGuest) return
    const newThread = createNewThread()
    setThreadIdState(newThread)
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_AUTH,
      intro: WELCOME_AUTH,
    }])
    setSidebarOpen(false)
    setThreadList(getThreadList())
  }

  const handleSelectThread = (tid: string) => {
    setThreadIdState(tid)
    setThreadId(tid)
    const saved = getMessages(tid)
    setMessages(saved.length > 0 ? saved : [{
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_AUTH,
      intro: WELCOME_AUTH,
    }])
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-full w-full">
      {!isGuest && (
      <>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed lg:static left-0 top-0 h-full w-[280px] z-50 border-r border-[#e5e5e5] bg-[#f5f5f5] flex flex-col"
            >
              <div className="p-4 border-b border-[#e5e5e5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrandMark size="sm" />
                  <div>
                    <span className="font-serif font-semibold text-sm text-[#1a1a1a] block leading-tight">{BRAND.shortName}</span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: BRAND_COLORS.accent }}>{BRAND.tagline}</span>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-[#e8e8e8] rounded-lg">
                  <X className="w-4 h-4 text-[#6b6b6b]" />
                </button>
              </div>
              <div className="p-3">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f9f9f9] transition-colors text-sm font-medium text-[#111111]"
                >
                  <Plus className="w-4 h-4" />
                  Nueva conversacion
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
                <div className="text-xs font-medium text-[#999999] uppercase tracking-wider mb-2 px-1">
                  Conversaciones
                </div>
                <div className="space-y-1">
                  {threadList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectThread(t.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors',
                        threadId === t.id
                          ? 'bg-[#e0e0e0] text-[#111111]'
                          : 'text-[#6b6b6b] hover:bg-[#e8e8e8]',
                      )}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-[#e5e5e5]">
                <a
                  href={BRAND.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-[#6b6b6b] hover:text-[#111111] transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  allinremodeling.us
                </a>
                <a
                  href={BRAND.estimate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                  style={{ color: BRAND_COLORS.accent }}
                >
                  Cotización gratis →
                </a>
                <button
                  onClick={() => onLogout?.()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#6b6b6b] hover:text-[#111111] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar sesión
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar (always visible on lg+) */}
      <div className="hidden lg:flex w-[280px] border-r border-[#e5e5e5] bg-[#f5f5f5] flex-col">
        <div className="p-4 border-b border-[#e5e5e5] flex items-center gap-2">
          <BrandMark size="sm" />
          <div>
            <span className="font-serif font-semibold text-sm text-[#1a1a1a] block leading-tight">{BRAND.shortName}</span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: BRAND_COLORS.accent }}>{BRAND.tagline}</span>
          </div>
        </div>
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f9f9f9] transition-colors text-sm font-medium text-[#111111]"
          >
            <Plus className="w-4 h-4" />
            Nueva conversacion
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
          <div className="text-xs font-medium text-[#999999] uppercase tracking-wider mb-2 px-1">
            Conversaciones
          </div>
          <div className="space-y-1">
            {threadList.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectThread(t.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors',
                  threadId === t.id
                    ? 'bg-[#e0e0e0] text-[#111111]'
                    : 'text-[#6b6b6b] hover:bg-[#e8e8e8]',
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 border-t border-[#e5e5e5]">
          <a
            href={BRAND.portfolio}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#6b6b6b] hover:text-[#111111] transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Ver portfolio
          </a>
        </div>
      </div>
      </>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className="absolute inset-0 z-50 bg-[#111111]/90 flex flex-col items-center justify-center text-white"
            >
              <ImagePlus className="w-16 h-16 mb-4" />
              <p className="text-xl font-medium">Suelta tu imagen aqui</p>
              <p className="text-sm text-white/60 mt-2">JPG, PNG hasta 10MB</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-[#e5e5e5] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-[#f5f5f5] rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-[#6b6b6b]" />
            </button>
            <h2 className="text-sm font-medium text-[#6b6b6b]">
              {isGuest ? `Consulta express · ${BRAND.name}` : `${BRAND.name} · Design AI`}
            </h2>
            {isGuest && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {guestUserMessages}/{guestLimit} consulta
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isGuest && onSignIn && (
              <button
                onClick={onSignIn}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#111111] text-white hover:bg-[#333333]"
              >
                Iniciar sesión
              </button>
            )}
            {messages.length > 1 && (
              <button
                onClick={() => {
                  setMessages([])
                  saveMessages(threadId, [])
                }}
                className="p-1.5 hover:bg-[#f5f5f5] rounded-lg transition-colors text-[#6b6b6b]"
                title="Limpiar chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="text-center max-w-lg">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BrandMark size="lg" />
                </div>
                <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2 font-serif">
                  {BRAND.name}
                </h1>
                <p className="text-xs tracking-[0.15em] uppercase mb-4" style={{ color: BRAND_COLORS.accent }}>
                  {BRAND.tagline}
                </p>
                <p className="text-[#6b6b6b] text-lg mb-8 leading-relaxed">
                  Sube una foto para análisis con Claude Vision. Referencias de cocinas y baños reales de Georgia.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {[
                    'Analiza esta foto de mi cocina',
                    'Calcula layout para 120 x 108 pulgadas',
                    'Muestra cuarzo blanco con vetas',
                    'Inspirame con un diseno moderno',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion)
                        textareaRef.current?.focus()
                      }}
                      className="p-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-xl text-sm text-[#111111] hover:bg-[#f5f5f5] hover:border-[#d1d1d1] transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{suggestion}</span>
                        <ChevronRight className="w-4 h-4 text-[#999999]" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="group">
                  {message.role === 'user' ? (
                    <div className="flex flex-col items-end">
                      <div className="bg-[#f5f5f5] rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%]">
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl}
                            alt="Uploaded"
                            className="rounded-lg mb-2 max-h-64 object-contain"
                          />
                        )}
                        <p className="text-sm text-[#111111] leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#111111] mb-1">All In AI</div>
                        <AssistantMessageBody
                          intro={message.intro}
                          blocks={message.blocks}
                          followUp={message.followUp}
                          products={message.products}
                          generatedImage={message.generatedImage}
                        />
                        {!message.blocks?.length && (
                          <p className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#111111] mb-1">All In AI</div>
                    <div className="flex items-center gap-2 text-sm text-[#6b6b6b]">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#999999] rounded-full typing-dot" />
                        <div className="w-2 h-2 bg-[#999999] rounded-full typing-dot" />
                        <div className="w-2 h-2 bg-[#999999] rounded-full typing-dot" />
                      </div>
                      <span className="text-xs">{loadingText}</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            {imagePreview && (
              <div className="relative inline-block mb-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 rounded-lg border border-[#e5e5e5]"
                />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-[#111111] text-white rounded-full flex items-center justify-center text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="relative bg-[#f9f9f9] border border-[#e5e5e5] rounded-2xl shadow-sm focus-within:border-[#111111] focus-within:shadow-md transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe tu cocina, sube una foto, o pregunta sobre productos..."
                className="w-full px-4 py-3 bg-transparent text-sm text-[#111111] placeholder-[#999999] resize-none focus:outline-none min-h-[48px] max-h-[200px]"
                rows={1}
                disabled={isLoading || (isGuest && guestUserMessages >= guestLimit)}
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:bg-[#e5e5e5] rounded-lg transition-colors text-[#6b6b6b]"
                    title="Subir imagen"
                    disabled={isLoading || (isGuest && guestUserMessages >= guestLimit)}
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !imagePreview) || isLoading || (isGuest && guestUserMessages >= guestLimit)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    (input.trim() || imagePreview) && !isLoading
                      ? 'bg-[#111111] text-white hover:bg-[#333333]'
                      : 'bg-[#e5e5e5] text-[#999999] cursor-not-allowed',
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-[#999999] text-center mt-2">
              {isGuest
                ? 'Modo invitado: tu consulta no se guarda. Crea cuenta para continuar.'
                : 'All In AI puede cometer errores. Verifica la informacion importante. Arrastra imagenes para subirlas.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
