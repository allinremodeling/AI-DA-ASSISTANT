import type { ChatMessage, StructuredChatResponse } from './types';
import { matchPortfolio, ALLIN_PORTFOLIO } from './portfolio';
import { ECOSYSTEM } from './brand';
import { ensureCloudinaryUrl, isCloudinaryConfigured } from './cloudinary';
import { isHttpUrl, safeImageRef } from './imageUtils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const CHAT_API =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined)
  || (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/chat` : '/.netlify/functions/chat');
const EDIT_API =
  (import.meta.env.VITE_EDIT_PHOTO_API_URL as string | undefined)
  || (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/edit-kitchen-photo` : '/.netlify/functions/edit-kitchen-photo');
const GUEST_MESSAGE_LIMIT = 3;

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export function buildConversationHistory(messages: { id?: string; role: string; content: string; intro?: string }[]): ChatHistoryTurn[] {
  return messages
    .filter((m) => m.id !== 'welcome' && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: (m.role === 'assistant' ? (m.intro || m.content) : m.content).trim(),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-6);
}

export function getGuestMessageLimit(): number {
  return GUEST_MESSAGE_LIMIT;
}

export function getUserLang(): string {
  if (typeof navigator === 'undefined') return 'es';
  return (navigator.language || 'es').slice(0, 2).toLowerCase();
}

function authHeaders(): Record<string, string> {
  return SUPABASE_ANON_KEY
    ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY }
    : {};
}

function structuredToMessage(data: StructuredChatResponse, userImageUrl?: string): ChatMessage {
  const summary = data.intro || 'Consulta AI-DA completada';

  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    role: 'assistant',
    content: summary,
    intro: data.intro,
    blocks: data.blocks,
    followUp: data.followUp,
    products: data.products?.length ? data.products : undefined,
    smartslabListings: data.smartslabListings?.length ? data.smartslabListings : undefined,
    generatedImage: safeImageRef(data.generatedImage),
    originalImage: safeImageRef(data.originalImage) || safeImageRef(userImageUrl),
    editPhotoApplied: data.editPhotoApplied,
    editPhotoPending: Boolean(data.shouldEditPhoto && !data.generatedImage),
    editPhotoPrompt: data.editPhotoPrompt,
  };
}

const EDIT_FAILURE_ES =
  'Estoy teniendo problemas para generar la visualización en este momento. ¿Te gustaría agendar una consulta gratuita para que nuestro diseñador te muestre opciones en persona? Llámanos al **470-733-0461**.';
const EDIT_FAILURE_EN =
  "I'm having trouble generating the visualization right now. Would you like to schedule a free consultation so our designer can show you options in person? Call us at **470-733-0461**.";

/** Step 1 — chat analysis only (fast). Photo edit runs separately via completePhotoEdit. */
export async function fetchChatResponse(
  content: string,
  imageData?: string,
  onProgress?: (status: string) => void,
  options?: { guest?: boolean; userMessageCount?: number; lang?: string; history?: ChatHistoryTurn[] },
): Promise<ChatMessage> {
  const lang = options?.lang || getUserLang();

  if (options?.guest && (options.userMessageCount ?? 0) >= GUEST_MESSAGE_LIMIT) {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      intro: 'Has usado tus 3 consultas express gratuitas.',
      content: 'Has usado tus 3 consultas express gratuitas.',
      blocks: [
        {
          type: 'recommendation',
          title: 'Continúa con una cuenta',
          text: 'Crea una cuenta gratis para seguir refinando tu diseño, guardar conversaciones y hablar con un asesor All In.',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
          tags: ['cuenta gratis'],
        },
      ],
      followUp: 'Inicia sesión arriba para desbloquear el asistente completo.',
    };
  }

  onProgress?.('🔎 Ok, déjame analizar tu proyecto...');

  const res = await fetch(CHAT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      message: content,
      ...(imageData
        ? (isHttpUrl(imageData) ? { imageUrl: imageData } : { imageBase64: imageData })
        : {}),
      guest: options?.guest ?? false,
      lang,
      history: options?.history?.length ? options.history : undefined,
      guestTurn: options?.guest ? (options.userMessageCount ?? 0) + 1 : undefined,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(errBody.error || `HTTP ${res.status}`);
  }

  onProgress?.('Buscando inspiración y materiales...');
  const data = (await res.json()) as StructuredChatResponse;
  return structuredToMessage(data, imageData);
}

/** Step 2 — generate edited image (slow). Returns patch to merge into the assistant message. */
export async function completePhotoEdit(
  message: ChatMessage,
  imageData: string,
  lang: string,
  onProgress?: (status: string) => void,
  options?: { guest?: boolean; userMessageCount?: number },
): Promise<Partial<ChatMessage>> {
  const prompt = message.editPhotoPrompt;
  if (!prompt || !imageData) {
    return { editPhotoPending: false };
  }

  onProgress?.('🎨 Visualizando cambios en tu cocina...');

  const res = await fetch(EDIT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      ...(isHttpUrl(imageData) ? { imageUrl: imageData } : { imageBase64: imageData }),
      prompt,
      lang,
    }),
  });

  if (!res.ok) {
    return { editPhotoPending: false, followUp: lang === 'es' ? EDIT_FAILURE_ES : EDIT_FAILURE_EN };
  }

  onProgress?.('✨ Optimizando imagen...');
  const data = await res.json() as { editedImageUrl?: string | null; error?: string };
  let editedUrl = safeImageRef(data.editedImageUrl ?? undefined);

  if (editedUrl && isCloudinaryConfigured()) {
    editedUrl = await ensureCloudinaryUrl(editedUrl) || editedUrl;
  }

  if (editedUrl) {
    return {
      generatedImage: editedUrl,
      originalImage: safeImageRef(imageData),
      editPhotoApplied: true,
      editPhotoPending: false,
      followUp: options?.guest && (options.userMessageCount ?? 0) + 1 === 2
        ? (lang === 'es'
          ? '¿Te gusta cómo se ve? **Crea una cuenta gratis** para guardar este diseño y seguir probando opciones con nuestro diseñador.'
          : 'Do you like how it looks? **Create a free account** to save this design and keep trying options with our designer.')
        : message.followUp,
    };
  }

  return {
    editPhotoPending: false,
    followUp: lang === 'es' ? EDIT_FAILURE_ES : EDIT_FAILURE_EN,
  };
}

/** Backward-compatible single call — prefer progressive flow in ChatInterface. */
export async function sendChatMessage(
  _threadId: string,
  content: string,
  imageData?: string,
  onProgress?: (status: string) => void,
  options?: { guest?: boolean; userMessageCount?: number; lang?: string; history?: ChatHistoryTurn[] },
): Promise<ChatMessage> {
  const lang = options?.lang || getUserLang();

  try {
    const message = await fetchChatResponse(content, imageData, onProgress, options);
    if (message.editPhotoPending && imageData && message.editPhotoPrompt) {
      const patch = await completePhotoEdit(message, imageData, lang, onProgress, options);
      return { ...message, ...patch };
    }
    return message;
  } catch (err) {
    if (SUPABASE_URL && CHAT_API.includes('supabase')) {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        intro: lang === 'es'
          ? 'No pude conectar con AI-DA en este momento. Verifica tu conexión e intenta de nuevo.'
          : 'Could not connect to AI-DA right now. Check your connection and try again.',
        content: err instanceof Error ? err.message : 'Error',
        followUp: lang === 'es'
          ? 'Si el problema continúa, llámanos al **470-733-0461**.'
          : 'If this persists, call us at **470-733-0461**.',
      };
    }
  }

  onProgress?.('Preparando respuesta...');
  await new Promise((r) => setTimeout(r, 1200));
  return buildLocalMockResponse(content, Boolean(imageData), options?.guest ?? false);
}

function buildLocalMockResponse(content: string, hasImage: boolean, guest: boolean): ChatMessage {
  const portfolio = matchPortfolio(content, 2);
  const p0 = portfolio[0] || ALLIN_PORTFOLIO[1];
  const p1 = portfolio[1] || ALLIN_PORTFOLIO[2];

  return structuredToMessage({
    intro: 'Ok, déjame analizar tu proyecto (modo demo local). En producción, Supabase conecta OpenAI Vision, web search y SmartSlab.',
    blocks: [
      {
        type: 'analysis',
        title: 'Tu proyecto — lo que entendemos',
        text: hasImage
          ? `Analizamos tu foto y consulta: "${content.slice(0, 120)}". Configura OPENAI_API_KEY en Supabase para análisis visual completo.`
          : `Entendemos que buscas: "${content.slice(0, 200)}". Validamos tu intención con tendencias actuales de remodelación en Georgia.`,
        tags: ['AI-DA', 'análisis'],
      },
      {
        type: 'inspiration',
        title: p0.title,
        text: `${p0.text} Paleta y acabados inspirados en tendencias actuales (Pinterest, Houzz, revistas de diseño).`,
        imageUrl: p0.imageUrl,
        source: 'Inspiración AI-DA',
        tags: ['inspiración'],
      },
      {
        type: 'recommendation',
        title: `${p0.title} · All In`,
        text: `${p1.text} All In Remodeling ofrece gabinetes, cuarzo Calacatta e instalación en Georgia.`,
        imageUrl: p1.imageUrl,
        source: 'All In Remodeling · All In Builders',
        tags: ['recomendación'],
      },
      {
        type: 'marketplace',
        title: 'SmartSlab · slabs para tu proyecto',
        text: 'Full slab disponible en SmartSlab — seleccionado según material y medidas de tu proyecto.',
        tags: ['SmartSlab'],
      },
      {
        type: 'action_plan',
        title: 'Plan con All In — hablar con asesor',
        text: 'Pasos para concretar tu remodelación con nuestro equipo.',
        steps: [
          { step: 1, title: 'Consulta virtual', description: '15 min con un asesor All In Remodeling.' },
          { step: 2, title: 'Selección de materiales', description: 'Showroom + SmartSlab marketplace.' },
          { step: 3, title: 'Cotización', description: 'Propuesta detallada sin compromiso.' },
          { step: 4, title: guest ? 'Crear cuenta AI-DA' : 'Ejecución', description: guest ? 'Guarda diseño y continúa.' : 'All In Builders instala.' },
        ],
        ctaLabel: 'Agendar consulta',
        ctaType: 'virtual',
        tags: ['asesor'],
      },
    ],
    smartslabListings: [
      {
        id: 'demo-1',
        name: 'Calacatta Hudson',
        material: 'Quartz',
        type: 'full_slab',
        location: 'Norcross, GA',
        sqft: 56.4,
        price: 1045,
        image_url: p0.imageUrl,
        url: ECOSYSTEM.smartslab.browse,
      },
    ],
    followUp: guest
      ? '¿Quieres ajustar materiales o estilo? Te quedan consultas express para refinar.'
      : '¿Agendamos tu consulta virtual?',
  });
}
