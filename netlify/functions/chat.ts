import { matchCuratedTrends, searchDesignTrends } from './lib/trends';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

interface ChatRequest {
  message: string;
  imageBase64?: string;
  guest?: boolean;
}

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  woo_url: string | null;
  slug: string | null;
  attributes: Record<string, unknown>;
  in_stock: boolean;
  created_at: string;
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

async function searchProducts(query: string): Promise<ProductRow[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];

  const url = new URL(`${SUPABASE_URL}/rest/v1/products`);
  url.searchParams.set('select', '*');
  url.searchParams.set('name', `ilike.*${query}*`);
  url.searchParams.set('limit', '6');

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) return [];
  return res.json();
}

function buildMockResponse(message: string, hasImage: boolean, guest: boolean) {
  const trends = matchCuratedTrends(message, 3);

  const blocks = [
    {
      type: 'analysis' as const,
      title: hasImage ? 'Análisis de tu espacio' : 'Contexto del proyecto',
      text: hasImage
        ? 'Detectamos una cocina con gabinetes de madera oscura y encimeras claras. La iluminación natural es moderada; conviene reforzar con LED bajo gabinete y pendientes sobre la zona de trabajo.'
        : 'Basándonos en tu consulta, cruzamos tendencias actuales de remodelación con soluciones aplicables a cocinas y baños residenciales.',
      imageUrl: hasImage ? undefined : trends[0]?.imageUrl,
      tags: hasImage ? ['análisis visual', 'iluminación'] : ['consulta'],
    },
    ...trends.map((t) => ({
      type: 'trend' as const,
      title: t.title,
      text: t.text,
      imageUrl: t.imageUrl,
      source: t.source,
      tags: ['tendencia 2026'],
    })),
    {
      type: 'recommendation' as const,
      title: 'Propuesta All In Remodeling',
      text: 'Combina gabinetes White Shaker con cuarzo Calacatta y hardware negro mate. Esta mezcla amplía visualmente el espacio y alinea tu proyecto con las tendencias más buscadas este año.',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      tags: ['gabinetes', 'cuarzo'],
    },
  ];

  return {
    intro: 'Aquí tienes un análisis con referencias de diseño actuales y recomendaciones personalizadas.',
    blocks,
    products: [],
    followUp: guest
      ? '¿Quieres guardar este diseño? Crea una cuenta gratis para continuar la conversación.'
      : '¿Quieres que busquemos estos materiales en nuestro inventario o generemos un render conceptual?',
  };
}

async function callOpenAI(message: string, imageBase64: string | undefined, trendsContext: string, products: ProductRow[]) {
  const systemPrompt = `Eres el asistente de diseño de All In Remodeling (cocinas y baños).
Responde SIEMPRE en español con JSON válido (sin markdown) usando este esquema:
{
  "intro": "texto breve de apertura",
  "blocks": [
    {
      "type": "analysis" | "trend" | "recommendation" | "inspiration",
      "title": "título del bloque",
      "text": "2-4 oraciones útiles",
      "imageUrl": "URL de imagen si aplica",
      "source": "fuente opcional",
      "tags": ["tag1", "tag2"]
    }
  ],
  "products": [],
  "followUp": "pregunta de cierre"
}

Reglas:
- Incluye mínimo 3 blocks; al menos 2 deben tener imageUrl.
- Usa las tendencias de referencia proporcionadas; cita la source cuando venga de internet.
- Mezcla tendencias globales con recomendaciones prácticas (no solo SKUs).
- Si hay imagen del usuario, el primer block type=analysis describe lo observado.
- products déjalo vacío; el servidor lo completa.
- Sé conciso y visual; evita listas largas con asteriscos.`;

  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: `Consulta: ${message}

Tendencias de referencia (internet):
${trendsContext}

Productos del inventario All In (${products.length}):
${products.map((p) => `- ${p.name} (${p.sku}) $${p.price}`).join('\n') || 'Sin coincidencias directas'}`,
    },
  ];

  if (imageBase64) {
    userContent.unshift({ type: 'image_url', image_url: { url: imageBase64 } });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 1800,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(raw);
  parsed.products = products.length > 0 ? products : parsed.products || [];
  return parsed;
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const body = (await req.json()) as ChatRequest;
    const message = body.message?.trim() || 'Consulta de diseño';
    const hasImage = Boolean(body.imageBase64);
    const guest = Boolean(body.guest);

    const trends = await searchDesignTrends(message);
    const trendsContext = trends
      .map((t, i) => `${i + 1}. ${t.title} (${t.source}): ${t.text}`)
      .join('\n');

    const productQuery = message.match(/cuarzo|quartz|gabinete|cabinet|shaker|encimera|counter/i)?.[0] || message.slice(0, 40);
    const products = await searchProducts(productQuery);

    let response;
    if (OPENAI_API_KEY && !OPENAI_API_KEY.includes('your-key')) {
      response = await callOpenAI(message, body.imageBase64, trendsContext, products);
    } else {
      response = buildMockResponse(message, hasImage, guest);
      if (products.length > 0) response.products = products;
    }

    if (guest && response.followUp) {
      response.followUp = 'Modo invitado: esta consulta no se guarda. Crea cuenta para continuar explorando diseños.';
    }

    return new Response(JSON.stringify(response), { status: 200, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
};
