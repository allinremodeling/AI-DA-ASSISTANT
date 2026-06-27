import type { ChatMessage, StructuredChatResponse } from './types';
import { matchPortfolio, ALLIN_PORTFOLIO } from './portfolio';
import { ECOSYSTEM } from './brand';

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

function isPublicUrl(value?: string): boolean {
  return Boolean(value && (value.startsWith('http://') || value.startsWith('https://')));
}

function sanitizeOriginalImage(value?: string): string | undefined {
  if (!value || !isPublicUrl(value)) return undefined;
  return value;
}

function structuredToMessage(data: StructuredChatResponse, userImageUrl?: string): ChatMessage {
  const summary = data.intro || 'Consulta AI-DA completada';

  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: summary,
    intro: data.intro,
    blocks: data.blocks,
    followUp: data.followUp,
    products: data.products?.length ? data.products : undefined,
    smartslabListings: data.smartslabListings?.length ? data.smartslabListings : undefined,
    generatedImage: data.generatedImage,
    originalImage: sanitizeOriginalImage(data.originalImage) || sanitizeOriginalImage(userImageUrl),
    editPhotoApplied: data.editPhotoApplied,
    editPhotoPending: data.shouldEditPhoto && !data.generatedImage,
  };
}

async function runPhotoEdit(
  imageData: string,
  prompt: string,
  lang: string,
  onProgress?: (status: string) => void,
): Promise<{ editedImageUrl?: string; error?: string }> {
  onProgress?.('🎨 Generando visualización con IA...');

  const isUrl = isPublicUrl(imageData);
  const res = await fetch(EDIT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(SUPABASE_ANON_KEY
        ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY }
        : {}),
    },
    body: JSON.stringify({
      ...(isUrl ? { imageUrl: imageData } : { imageBase64: imageData }),
      prompt,
      lang,
    }),
  });

  if (!res.ok) {
    return { error: `edit_http_${res.status}` };
  }

  const data = await res.json() as { editedImageUrl?: string | null; error?: string };
  if (data.editedImageUrl) {
    return { editedImageUrl: data.editedImageUrl };
  }
  return { error: data.error || 'edit_failed' };
}

const EDIT_FAILURE_ES =
  'Estoy teniendo problemas para generar la visualización en este momento. ¿Te gustaría agendar una consulta gratuita para que nuestro diseñador te muestre opciones en persona? Llámanos al **470-733-0461**.';
const EDIT_FAILURE_EN =
  "I'm having trouble generating the visualization right now. Would you like to schedule a free consultation so our designer can show you options in person? Call us at **470-733-0461**.";

export async function sendChatMessage(
  _threadId: string,
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

  const mayEdit = Boolean(imageData) && /cambiar|change|edit|modificar|gabinete|cabinet|encimera|counter|color|quartz|cuarzo|shaker|visualiz|render|ponle|pon|aplica|material|diseño|design/i.test(content);

  let editProgressTimer: ReturnType<typeof setTimeout> | undefined;
  if (mayEdit) {
    editProgressTimer = setTimeout(() => onProgress?.('📸 Analizando tu foto con detalle...'), 4000);
  } else if (imageData) {
    setTimeout(() => onProgress?.('📸 Analizando tu foto con detalle...'), 3500);
  }

  try {
    const res = await fetch(CHAT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SUPABASE_ANON_KEY
          ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY }
          : {}),
      },
      body: JSON.stringify({
        message: content,
        ...(imageData
          ? (isPublicUrl(imageData) ? { imageUrl: imageData } : { imageBase64: imageData })
          : {}),
        guest: options?.guest ?? false,
        lang,
        history: options?.history?.length ? options.history : undefined,
        guestTurn: options?.guest ? (options.userMessageCount ?? 0) + 1 : undefined,
      }),
    });

    if (res.ok) {
      onProgress?.('Buscando inspiración y materiales...');
      const data = (await res.json()) as StructuredChatResponse;
      if (editProgressTimer) clearTimeout(editProgressTimer);

      let message = structuredToMessage(data, imageData);

      if (data.shouldEditPhoto && data.editPhotoPrompt && imageData && !data.generatedImage) {
        onProgress?.('🎨 Visualizando cambios en tu cocina...');
        editProgressTimer = setTimeout(() => onProgress?.('✨ Afinando detalles del diseño...'), 12000);

        const edit = await runPhotoEdit(imageData, data.editPhotoPrompt, lang, onProgress);
        if (editProgressTimer) clearTimeout(editProgressTimer);

        if (edit.editedImageUrl) {
          message = {
            ...message,
            generatedImage: edit.editedImageUrl,
            editPhotoApplied: true,
            editPhotoPending: false,
            originalImage: sanitizeOriginalImage(imageData),
            followUp: options?.guest && (options.userMessageCount ?? 0) + 1 === 2
              ? (lang === 'es'
                ? '¿Te gusta cómo se ve? **Crea una cuenta gratis** para guardar este diseño y seguir probando opciones con nuestro diseñador.'
                : 'Do you like how it looks? **Create a free account** to save this design and keep trying options with our designer.')
              : message.followUp,
          };
        } else {
          message = {
            ...message,
            editPhotoPending: false,
            followUp: lang === 'es' ? EDIT_FAILURE_ES : EDIT_FAILURE_EN,
          };
        }
      }

      return message;
    }

    const errBody = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(errBody.error || `HTTP ${res.status}`);
  } catch (err) {
    if (editProgressTimer) clearTimeout(editProgressTimer);
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
    // fall through to local mock only when no Supabase configured
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
