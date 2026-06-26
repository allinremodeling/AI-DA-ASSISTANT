import type { ChatMessage, StructuredChatResponse } from './types';
import { matchPortfolio, ALLIN_PORTFOLIO } from './portfolio';
import { ECOSYSTEM } from './brand';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const CHAT_API =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined)
  || (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/chat` : '/.netlify/functions/chat');
const GUEST_MESSAGE_LIMIT = 1;

export function getGuestMessageLimit(): number {
  return GUEST_MESSAGE_LIMIT;
}

function structuredToMessage(data: StructuredChatResponse): ChatMessage {
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
  };
}

export async function sendChatMessage(
  _threadId: string,
  content: string,
  imageBase64?: string,
  onProgress?: (status: string) => void,
  options?: { guest?: boolean; userMessageCount?: number },
): Promise<ChatMessage> {
  if (options?.guest && (options.userMessageCount ?? 0) >= GUEST_MESSAGE_LIMIT) {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      intro: 'Has usado tu consulta express gratuita.',
      content: 'Has usado tu consulta express gratuita.',
      blocks: [
        {
          type: 'recommendation',
          title: 'Continúa con una cuenta',
          text: 'Crea una cuenta gratis para guardar conversaciones, buscar productos en inventario y generar más diseños.',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
          tags: ['cuenta gratis'],
        },
      ],
      followUp: 'Inicia sesión arriba para desbloquear el asistente completo.',
    };
  }

  onProgress?.('Analizando foto con Claude Vision...');

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
        imageBase64,
        guest: options?.guest ?? false,
      }),
    });

    if (res.ok) {
      onProgress?.('Generando recomendaciones...');
      const data = (await res.json()) as StructuredChatResponse;
      return structuredToMessage(data);
    }
  } catch {
    // fall through to local mock
  }

  onProgress?.('Preparando respuesta...');
  await new Promise((r) => setTimeout(r, 1200));
  return buildLocalMockResponse(content, Boolean(imageBase64), options?.guest ?? false);
}

function buildLocalMockResponse(content: string, hasImage: boolean, guest: boolean): ChatMessage {
  const portfolio = matchPortfolio(content, 2);
  const p0 = portfolio[0] || ALLIN_PORTFOLIO[1];
  const p1 = portfolio[1] || ALLIN_PORTFOLIO[2];

  return structuredToMessage({
    intro: 'Consulta AI-DA (modo demo local). En producción Supabase conecta Claude Vision, SmartSlab y el ecosistema All In.',
    blocks: [
      {
        type: 'visual_analysis',
        title: hasImage ? 'Análisis visual' : 'Evaluación inicial',
        text: hasImage
          ? 'Activa ANTHROPIC_API_KEY en Supabase secrets para análisis Claude Vision de tu foto.'
          : content.slice(0, 200),
        tags: ['AI-DA'],
      },
      {
        type: 'external_inspiration',
        title: 'Tendencia: Calacatta & Waterfall',
        text: 'Referencia de diseño 2026 mostrada aquí — sin salir del chat.',
        imageUrl: p0.imageUrl,
        source: 'Design trend 2026',
        tags: ['tendencia'],
      },
      {
        type: 'ecosystem',
        title: `${p0.title} · SmartSlab Calacatta`,
        text: `${p0.text} Slabs y remanentes disponibles vía SmartSlab en Georgia.`,
        imageUrl: p1.imageUrl,
        source: 'All In Remodeling · SmartSlab',
        tags: ['ecosistema'],
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
    followUp: guest ? 'Crea cuenta para continuar con un asesor.' : '¿Agendamos tu consulta virtual?',
  });
}
