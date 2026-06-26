import type { ChatMessage, StructuredChatResponse } from './types';
import { matchPortfolio, ALLIN_PORTFOLIO } from './portfolio';

const CHAT_API = '/.netlify/functions/chat';
const GUEST_MESSAGE_LIMIT = 1;

export function getGuestMessageLimit(): number {
  return GUEST_MESSAGE_LIMIT;
}

function structuredToMessage(data: StructuredChatResponse): ChatMessage {
  const summary = [data.intro, ...(data.blocks?.map((b) => b.title) || [])].filter(Boolean).join(' · ');

  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: summary,
    intro: data.intro,
    blocks: data.blocks,
    followUp: data.followUp,
    products: data.products?.length ? data.products : undefined,
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
      headers: { 'Content-Type': 'application/json' },
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
  const portfolio = matchPortfolio(content, 3);
  const p = (i: number) => portfolio[i]?.imageUrl || ALLIN_PORTFOLIO[i % ALLIN_PORTFOLIO.length].imageUrl;

  const isLayout = /\d+/.test(content) && /pulgada|inch|layout|medida|dimension/i.test(content);
  const isProduct = /producto|cuarzo|gabinete|shaker|quartz|cabinet|buscar|inventario/i.test(content);

  if (isLayout) {
    const dims = content.match(/(\d+(?:\.\d+)?)/g);
    const w = dims ? parseFloat(dims[0]) : 120;
    const l = dims ? parseFloat(dims[1] || dims[0]) : 108;

    return structuredToMessage({
      intro: `Layout optimizado para ${w}" × ${l}" (${Math.round((w * l) / 144)} sq ft).`,
      blocks: [
        {
          type: 'analysis',
          title: 'Distribución recomendada',
          text: w >= 144
            ? 'Layout en U con isla central de 36"×60". Circulación de 42" entre frentes de trabajo.'
            : w >= 120
              ? 'Layout en L con opción de isla compacta 30"×48" si el flujo lo permite.'
              : 'Layout lineal o L compacto; isla no recomendada por espacio limitado.',
          imageUrl: p(0),
          tags: ['layout', 'medidas'],
        },
        {
          type: 'trend',
          title: 'Referencia All In — Calacatta Alpharetta',
          text: 'Proyecto real con isla Calacatta en Alpharetta, GA. Referencia ideal para layouts con isla central.',
          imageUrl: p(1),
          source: 'All In Remodeling Portfolio',
          tags: ['proyecto real'],
        },
        {
          type: 'recommendation',
          title: 'Estimación de materiales',
          text: `${Math.ceil(w / 24)} gabinetes base, ${Math.ceil(w / 30)} gabinetes wall, encimera cuarzo ${w >= 120 ? '96"' : '72"'}. Presupuesto orientativo: $${(Math.ceil(w / 24) * 300 + 1500).toLocaleString()}.`,
          imageUrl: p(2),
          tags: ['presupuesto'],
        },
      ],
      followUp: guest
        ? 'Consulta express completada. Crea cuenta para buscar productos en inventario.'
        : '¿Buscamos los gabinetes y cuarzo en nuestro catálogo?',
    });
  }

  if (isProduct) {
    return structuredToMessage({
      intro: 'Estas combinaciones están alineadas con nuestro catálogo All In Remodeling.',
      blocks: [
        {
          type: 'trend',
          title: portfolio[0]?.title || 'Calacatta Quartz',
          text: portfolio[0]?.text || 'Cuarzo Calacatta — bestseller All In Remodeling.',
          imageUrl: p(0),
          source: 'All In Remodeling Portfolio',
          tags: ['bestseller'],
        },
        {
          type: 'inspiration',
          title: portfolio[1]?.title || 'Golden Carrara',
          text: portfolio[1]?.text || 'Referencia de cocina con piedra cálida.',
          imageUrl: p(1),
          source: 'All In Remodeling Portfolio',
          tags: ['inspiración'],
        },
      ],
      followUp: guest ? 'Inicia sesión para ver precios e inventario en vivo.' : '¿Filtramos por precio o estilo?',
    });
  }

  return structuredToMessage({
    intro: hasImage
      ? 'Analicé tu espacio y lo contrasté con tendencias actuales de remodelación.'
      : 'Aquí tienes inspiración basada en tendencias de diseño 2026.',
    blocks: [
      {
        type: 'analysis',
        title: hasImage ? 'Análisis visual' : 'Tu consulta',
        text: hasImage
          ? 'Conecta a Netlify con ANTHROPIC_API_KEY para análisis Claude Vision en producción. Referencias basadas en portfolio All In.'
          : 'Referencias de cocinas y baños reales de All In Remodeling en Georgia.',
        tags: ['análisis'],
      },
      ...portfolio.slice(0, 3).map((item) => ({
        type: 'inspiration' as const,
        title: item.title,
        text: `${item.text} · ${item.location}`,
        imageUrl: item.imageUrl,
        source: 'All In Remodeling Portfolio',
        tags: ['proyecto real'],
      })),
      {
        type: 'recommendation',
        title: 'Agenda con All In Remodeling',
        text: 'Consulta virtual o visita al showroom. Especialistas en cuarzo, gabinetes y remodelaciones integrales en Georgia.',
        imageUrl: ALLIN_PORTFOLIO[0].imageUrl,
        source: 'allinremodeling.us',
        tags: ['cita'],
      },
    ],
    followUp: guest
      ? 'Consulta express completada. Regístrate para renders, inventario y más preguntas.'
      : '¿Generamos un render conceptual o buscamos productos en inventario?',
  });
}
