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
import { sendChatMessage, getGuestMessageLimit, buildConversationHistory } from '../lib/chatService'
import { createNewThread, getThreadId, setThreadId, getThreadList, saveMessages, saveThreadTitle, getMessages } from '../lib/thread'
import { AssistantMessageBody } from './DesignBlocks'
import { BRAND, BRAND_ASSETS, BRAND_COLORS, ECOSYSTEM } from '../lib/brand'
import { BrandMark } from './BrandMark'

const WELCOME_AUTH = `Bienvenido a ${BRAND.productFullName}.\n\nRecibirás 4 secciones: análisis visual, inspiración externa, referencias del ecosistema All In + SmartSlab, y un plan de acción para hablar con un asesor.`
const WELCOME_GUEST = `Consulta express · ${BRAND.productName}\n\nTienes **3 consultas gratuitas** para describir tu proyecto, subir una foto y afinar el diseño (materiales, estilo, medidas). Al final verás un plan de acción con All In.`

function makeWelcomeMessage(isGuestMode: boolean): ChatMessage {
  const text = isGuestMode ? WELCOME_GUEST : WELCOME_AUTH
  return { id: 'welcome', role: 'assistant', content: text, intro: text }
}

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
      setMessages([makeWelcomeMessage(true)])
      return
    }

    const existing = getThreadId()
    if (existing) {
      setThreadIdState(existing)
      const saved = getMessages(existing)
      if (saved.length > 0) {
        setMessages(saved)
      } else {
        setMessages([makeWelcomeMessage(false)])
      }
    } else {
      const newThread = createNewThread()
      setThreadIdState(newThread)
      setMessages([makeWelcomeMessage(false)])
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

    const imageToSend = imagePreview || undefined
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim() || (imageToSend ? 'Analiza esta imagen de mi cocina' : ''),
      imageUrl: imageToSend,
    }

    const updated = [...messages, userMessage]
    setMessages(updated)
    setInput('')
    setImagePreview(null)
    setIsLoading(true)
    setLoadingText('🔎 Analizando tu proyecto...')

    const userLang = navigator.language.slice(0, 2).toLowerCase()
    const history = isGuest ? buildConversationHistory(messages) : undefined

    const response = await sendChatMessage(
      threadId,
      userMessage.content,
      imageToSend,
      (status) => setLoadingText(status),
      { guest: isGuest, userMessageCount: guestUserMessages, lang: userLang, history },
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
    setMessages([makeWelcomeMessage(false)])
    setSidebarOpen(false)
    setThreadList(getThreadList())
  }

  const handleSelectThread = (tid: string) => {
    setThreadIdState(tid)
    setThreadId(tid)
    const saved = getMessages(tid)
    setMessages(saved.length > 0 ? saved : [makeWelcomeMessage(false)])
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
                  href={ECOSYSTEM.remodeling.url}
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
        <div className="h-auto min-h-12 flex items-center justify-between px-3 sm:px-4 py-2 border-b border-[#e5e5e5] shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {!isGuest && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-[#f5f5f5] rounded-lg transition-colors lg:hidden shrink-0"
              >
                <Menu className="w-5 h-5 text-[#6b6b6b]" />
              </button>
            )}
            <a
              href={ECOSYSTEM.remodeling.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center shrink-0 hover:opacity-90 transition-opacity"
              title="All In Remodeling"
            >
              <img
                src={BRAND_ASSETS.logoAllIn}
                alt="All In Remodeling"
                className="h-7 sm:h-8 w-auto max-w-[130px] object-contain"
              />
            </a>
            {isGuest && (
              <>
                <span className="text-[#ddd] hidden sm:inline">|</span>
                <span className="text-xs sm:text-sm font-medium text-[#6b6b6b] truncate hidden sm:inline">
                  Express · {BRAND.productName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0 whitespace-nowrap">
                  {guestUserMessages}/{guestLimit}
                </span>
              </>
            )}
            {!isGuest && (
              <h2 className="text-xs sm:text-sm font-medium text-[#6b6b6b] truncate">
                {BRAND.productName}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
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
                  const welcome = makeWelcomeMessage(isGuest)
                  setMessages([welcome])
                  if (!isGuest) saveMessages(threadId, [welcome])
                }}
                className="p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors text-[#6b6b6b] chat-touch-target"
                title="Limpiar chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar chat-scroll"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-8">
              <div className="text-center max-w-lg">
                <div className="mx-auto mb-6">
                  <BrandMark size="lg" />
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0a0a0a] mb-2">
                  {BRAND.productName}
                </h1>
                <p className="text-xs tracking-[0.14em] uppercase font-semibold mb-4" style={{ color: BRAND_COLORS.accent }}>
                  {BRAND.tagline}
                </p>
                <p className="text-[#666] text-base mb-8 leading-relaxed">
                  Análisis visual · Inspiración · Ecosistema All In + SmartSlab · Plan con asesor
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {[
                    'Analiza esta foto de mi cocina',
                    'Calcula layout para 120 x 108 pulgadas',
                    'Muestra cuarzo blanco con vetas',
                    'Inspírame con un diseño moderno',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion)
                        textareaRef.current?.focus()
                      }}
                      className="p-4 bg-white border border-[#e5e5e5] rounded-xl text-sm text-[#111111] hover:border-[#e85d04]/40 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium leading-snug">{suggestion}</span>
                        <ChevronRight className="w-4 h-4 text-[#bbb] group-hover:text-[#e85d04] shrink-0 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="group min-w-0">
                  {message.role === 'user' ? (
                    <div className="flex flex-col items-end">
                      <div className="bg-[#f5f5f5] rounded-2xl rounded-tr-md px-3 sm:px-4 py-3 max-w-[92%] sm:max-w-[80%]">
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
                    <div className="flex gap-2 sm:gap-3 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#111111] rounded-full items-center justify-center flex-shrink-0 mt-0.5 flex">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-sm font-medium text-[#111111] mb-1">AI-DA</div>
                        <AssistantMessageBody
                          intro={message.intro}
                          blocks={message.blocks}
                          followUp={message.followUp}
                          products={message.products}
                          smartslabListings={message.smartslabListings}
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
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#111111] rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#111111] mb-1">AI-DA</div>
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
        <div className="shrink-0 px-2 sm:px-4 pb-2 pt-2 chat-safe-bottom">
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
            <div className="relative bg-white border border-[#d4d4d4] rounded-2xl shadow-sm focus-within:border-[#e85d04] focus-within:ring-2 focus-within:ring-[#e85d04]/15 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isGuest
                    ? guestUserMessages >= guestLimit
                      ? 'Consultas express agotadas — inicia sesión para continuar'
                      : guestUserMessages === 0
                        ? 'Describe tu cocina o sube una foto para empezar...'
                        : `Ajusta materiales, estilo o medidas (${guestLimit - guestUserMessages} consulta${guestLimit - guestUserMessages === 1 ? '' : 's'} restante${guestLimit - guestUserMessages === 1 ? '' : 's'})...`
                    : 'Describe tu cocina, sube una foto, o pregunta sobre productos...'
                }
                className="w-full px-4 py-3 bg-transparent text-sm sm:text-sm chat-input-text text-[#111111] placeholder-[#999999] resize-none focus:outline-none min-h-[52px] max-h-[200px]"
                rows={1}
                disabled={isLoading || (isGuest && guestUserMessages >= guestLimit)}
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-[#e5e5e5] rounded-lg transition-colors text-[#6b6b6b] chat-touch-target"
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
                    'p-2 rounded-lg transition-colors chat-touch-target',
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
                ? guestUserMessages >= guestLimit
                  ? 'Has usado tus 3 consultas express. Inicia sesión para seguir afinando con un asesor All In.'
                  : `Consulta express ${guestUserMessages + 1}/${guestLimit}: puedes refinar tu diseño antes de crear cuenta.`
                : 'All In AI puede cometer errores. Verifica la informacion importante. Arrastra imagenes para subirlas.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
