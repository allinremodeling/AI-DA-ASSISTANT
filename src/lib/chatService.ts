import type { ChatMessage, StructuredChatResponse } from './types';

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

  onProgress?.('Buscando tendencias de diseño...');

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
          imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
          tags: ['layout', 'medidas'],
        },
        {
          type: 'trend',
          title: 'Tendencia: Work Triangle 2.0',
          text: 'Los diseñadores priorizan zonas (prep, cook, clean) sobre triángulo clásico. Integra almacenamiento vertical y LED bajo gabinete.',
          imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
          source: 'NKBA 2026',
          tags: ['tendencia'],
        },
        {
          type: 'recommendation',
          title: 'Estimación de materiales',
          text: `${Math.ceil(w / 24)} gabinetes base, ${Math.ceil(w / 30)} gabinetes wall, encimera cuarzo ${w >= 120 ? '96"' : '72"'}. Presupuesto orientativo: $${(Math.ceil(w / 24) * 300 + 1500).toLocaleString()}.`,
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
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
          title: 'White Shaker + Calacatta',
          text: 'La combinación más vendida: gabinetes shaker blancos con cuarzo vetas grises. Funciona en cocinas tradicionales y modernas.',
          imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b0be4e00c?w=800&q=80',
          source: 'All In Catalog',
          tags: ['bestseller'],
        },
        {
          type: 'inspiration',
          title: 'Navy Island Accent',
          text: 'Isla en navy con encimera clara: tendencia 2026 para añadir contraste sin pintar toda la cocina.',
          imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
          source: 'Houzz Trends',
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
        title: hasImage ? 'Lo que vemos en tu foto' : 'Tu consulta',
        text: hasImage
          ? 'Gabinetes de tono oscuro con encimeras claras. Oportunidad: iluminación en capas y cambio a shaker claro para ampliar visualmente el espacio.'
          : 'Cruzamos tu idea con referencias de cocinas y baños premium en EE.UU.',
        imageUrl: hasImage ? undefined : 'https://images.unsplash.com/photo-1556911220-e15b0be4e00c?w=800&q=80',
        tags: ['análisis'],
      },
      {
        type: 'trend',
        title: 'Warm Minimalism 2026',
        text: 'Paletas cálidas, madera natural y cuarzo con vetas sutiles. Reemplaza granito oscuro por Calacatta o Arabescato.',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        source: 'Architectural Digest',
        tags: ['tendencia'],
      },
      {
        type: 'trend',
        title: 'Integrated LED Lighting',
        text: 'Perfiles LED bajo gabinete y en estantes abiertos. Esencial si mantienes madera oscura en bases.',
        imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        source: 'Lighting Design Weekly',
        tags: ['iluminación'],
      },
      {
        type: 'recommendation',
        title: 'Propuesta All In',
        text: 'White Shaker (CAB-001–005) + Cuarzo Calacatta (QZ-001) + hardware negro mate. Transformación de alto impacto con ROI fuerte en reventa.',
        imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
        tags: ['recomendación'],
      },
    ],
    followUp: guest
      ? 'Consulta express completada. Regístrate para renders, inventario y más preguntas.'
      : '¿Generamos un render conceptual o buscamos productos en inventario?',
  });
}
