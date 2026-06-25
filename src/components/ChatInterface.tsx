import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImagePlus,
  X,
  Loader2,
  ArrowUp,
  Sparkles,
  ExternalLink,
  Trash2,
  ChevronRight,
  Menu,
} from 'lucide-react';
import type { Product, ChatMessage } from '../lib/types';
import { cn } from '../lib/utils';
import { saveMessages } from '../lib/thread';

interface ChatInterfaceProps {
  threadId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleSidebar: () => void;
}

export function ChatInterface({
  threadId,
  messages,
  setMessages,
  isLoading,
  setIsLoading,
  onToggleSidebar,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSend = async () => {
    if (!input.trim() && !imagePreview) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim() || (imagePreview ? 'Analiza esta imagen de mi cocina' : ''),
      imageUrl: imagePreview || undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setImagePreview(null);
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: generateMockResponse(userMessage.content),
      };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(threadId, finalMessages);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const generateMockResponse = (userContent: string): string => {
    return `He analizado tu solicitud sobre "${userContent}". 

## Análisis del Espacio

Tu cocina tiene un gran potencial para una transformación moderna. Basado en tu descripción, recomiendo:

1. **Gabinetes**: Estilo shaker en blanco o navy para un look contemporáneo
2. **Encimera**: Cuarzo Calacatta con vetas dramáticas para un punto focal elegante
3. **Distribución**: Layout en L para maximizar el espacio de trabajo

## Próximos Pasos

¿Te gustaría que busque productos específicos en nuestro inventario o que calcule un layout con tus medidas exactas?`;
  };

  return (
    <div className="flex flex-col h-full w-full relative">
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
            <p className="text-xl font-medium">Suelta tu imagen aquí</p>
            <p className="text-sm text-white/60 mt-2">JPG, PNG hasta 10MB</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-[#e5e5e5] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 hover:bg-[#f5f5f5] rounded-lg transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-[#6b6b6b]" />
          </button>
          <h2 className="text-sm font-medium text-[#6b6b6b]">All In AI - Asistente de Diseño</h2>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                saveMessages(threadId, []);
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
              <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-[#111111] mb-3">
                Asistente de Diseño AI
              </h1>
              <p className="text-[#6b6b6b] text-lg mb-8 leading-relaxed">
                Sube una foto de tu cocina, describe tu espacio, o pregúntame sobre gabinetes y cuarzo. Te ayudaré a diseñar tu remodelación ideal.
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
                      setInput(suggestion);
                      textareaRef.current?.focus();
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
                      <div className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap markdown-content">
                        {message.content}
                      </div>
                      {message.products && message.products.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {message.products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                        </div>
                      )}
                      {message.generatedImage && (
                        <div className="mt-4">
                          <img
                            src={message.generatedImage}
                            alt="Diseño conceptual"
                            className="rounded-xl max-h-80 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading state */}
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
                    <span className="text-xs">Analizando...</span>
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
              disabled={isLoading}
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 hover:bg-[#e5e5e5] rounded-lg transition-colors text-[#6b6b6b]"
                  title="Subir imagen"
                  disabled={isLoading}
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
                disabled={(!input.trim() && !imagePreview) || isLoading}
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
            All In AI puede cometer errores. Verifica la información importante. Arrastra imágenes para subirlas.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-[#f9f9f9] relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e5e5e5/999999?text=Producto';
          }}
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-[#111111] line-clamp-2">{product.name}</p>
        <p className="text-xs text-[#6b6b6b] mt-1">{product.sku}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-[#111111]">${product.price.toFixed(2)}</span>
          <a
            href={product.woo_url || `https://allinremodeling.us/product/${product.slug || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-[#111111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333333] transition-colors inline-flex items-center gap-1"
          >
            Ver <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
