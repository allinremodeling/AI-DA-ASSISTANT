import { matchCuratedTrends, searchDesignTrends, matchPortfolio } from './lib/trends';
import { analyzeImageWithClaude } from './lib/vision';
import { ALLIN_PORTFOLIO } from './lib/portfolio';

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

interface DesignBlock {
  type: string;
  title: string;
  text: string;
  imageUrl?: string;
  source?: string;
  tags?: string[];
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

function enrichBlocksWithReferenceImages(
  blocks: DesignBlock[],
  referenceImages: { imageUrl: string; source: string }[],
): DesignBlock[] {
  let refIndex = 0;
  return blocks.map((block) => {
    if (block.type === 'analysis') return block;
    if (block.imageUrl?.includes('unsplash.com')) {
      const ref = referenceImages[refIndex++ % referenceImages.length];
      return { ...block, imageUrl: ref.imageUrl, source: block.source || ref.source };
    }
    if (!block.imageUrl && referenceImages.length > 0) {
      const ref = referenceImages[refIndex++ % referenceImages.length];
      return { ...block, imageUrl: ref.imageUrl, source: block.source || ref.source };
    }
    return block;
  });
}

function buildMockResponse(
  message: string,
  hasImage: boolean,
  guest: boolean,
  visionAnalysis: string,
) {
  const trends = matchCuratedTrends(message, 3);
  const portfolio = matchPortfolio(message, 2);

  const analysisText = visionAnalysis
    || (hasImage
      ? 'Sube una foto clara para análisis con Claude Vision. Mientras tanto, comparamos tu consulta con proyectos reales de All In Remodeling en Georgia.'
      : 'Cruzamos tu consulta con tendencias actuales y proyectos reales de cocinas y baños en Georgia.');

  const blocks: DesignBlock[] = [
    {
      type: 'analysis',
      title: hasImage ? 'Análisis visual (Claude Vision)' : 'Contexto del proyecto',
      text: analysisText,
      tags: hasImage ? ['análisis IA', 'foto del cliente'] : ['consulta'],
    },
    ...portfolio.map((p) => ({
      type: 'inspiration' as const,
      title: p.title,
      text: `${p.text} · ${p.location}`,
      imageUrl: p.imageUrl,
      source: 'All In Remodeling Portfolio',
      tags: ['proyecto real', 'referencia'],
    })),
    ...trends.slice(0, 2).map((t) => ({
      type: 'trend' as const,
      title: t.title,
      text: t.text,
      imageUrl: t.imageUrl,
      source: t.source,
      tags: ['tendencia 2026'],
    })),
    {
      type: 'recommendation',
      title: 'Propuesta All In Remodeling',
      text: 'Agenda una consulta virtual o visita nuestro showroom en Georgia. Especialistas en cuarzo Calacatta, gabinetes premium y remodelaciones integrales.',
      imageUrl: ALLIN_PORTFOLIO[1].imageUrl,
      source: 'allinremodeling.us',
      tags: ['cita', 'showroom'],
    },
  ];

  return {
    intro: 'Recomendaciones basadas en proyectos reales de All In Remodeling y tendencias de diseño interior.',
    blocks,
    products: [] as ProductRow[],
    followUp: guest
      ? 'Consulta express completada. Crea cuenta para más análisis y acceso a inventario.'
      : '¿Agendamos una cita virtual o buscamos materiales en inventario?',
  };
}

async function callOpenAI(
  message: string,
  imageBase64: string | undefined,
  trendsContext: string,
  portfolioContext: string,
  visionAnalysis: string,
  products: ProductRow[],
) {
  const systemPrompt = `Eres el asistente de diseño de All In Remodeling (Atlanta, Georgia).
Especialidad: gabinetes premium, cuarzo Calacatta, granito, vanidades y remodelaciones integrales.

Responde SIEMPRE en español con JSON válido (sin markdown):
{
  "intro": "texto breve",
  "blocks": [
    {
      "type": "analysis" | "trend" | "recommendation" | "inspiration",
      "title": "...",
      "text": "2-4 oraciones",
      "imageUrl": "usa SOLO URLs del contexto de portfolio/tendencias",
      "source": "fuente",
      "tags": ["tag"]
    }
  ],
  "products": [],
  "followUp": "pregunta"
}

Reglas:
- Mínimo 4 blocks. El block "analysis" usa el análisis Claude Vision si existe.
- Para imageUrl copia URLs exactas del contexto portfolio/tendencias (proyectos allinremodeling.us).
- No uses unsplash ni URLs inventadas.
- Personaliza recomendaciones según lo observado en la foto.
- products déjalo vacío; el servidor lo completa.`;

  const userParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: `Consulta: ${message}

${visionAnalysis ? `ANÁLISIS CLAUDE VISION (usar como base del block analysis):\n${visionAnalysis}\n` : ''}
Proyectos reales All In Remodeling:
${portfolioContext}

Tendencias y referencias:
${trendsContext}

Inventario (${products.length}):
${products.map((p) => `- ${p.name} (${p.sku}) $${p.price}`).join('\n') || 'Sin coincidencias'}`,
    },
  ];

  if (imageBase64 && !visionAnalysis) {
    userParts.unshift({ type: 'image_url', image_url: { url: imageBase64 } });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userParts },
      ],
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content);
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

    let visionAnalysis = '';
    if (body.imageBase64) {
      visionAnalysis = await analyzeImageWithClaude(body.imageBase64, message);
    }

    const trends = await searchDesignTrends(`${message} ${visionAnalysis}`.slice(0, 500));
    const portfolio = matchPortfolio(`${message} ${visionAnalysis}`.slice(0, 500), 3);

    const trendsContext = trends
      .map((t, i) => `${i + 1}. ${t.title} | ${t.imageUrl} | (${t.source}): ${t.text}`)
      .join('\n');

    const portfolioContext = portfolio
      .map((p, i) => `${i + 1}. ${p.title} | ${p.imageUrl} | ${p.location}: ${p.text}`)
      .join('\n');

    const referenceImages = [
      ...portfolio.map((p) => ({ imageUrl: p.imageUrl, source: p.source })),
      ...trends.map((t) => ({ imageUrl: t.imageUrl, source: t.source })),
    ];

    const productQuery =
      message.match(/cuarzo|quartz|gabinete|cabinet|shaker|encimera|counter|calacatta/i)?.[0]
      || message.slice(0, 40);
    const products = await searchProducts(productQuery);

    let response;
    if (OPENAI_API_KEY && !OPENAI_API_KEY.includes('your-key')) {
      response = await callOpenAI(
        message,
        body.imageBase64,
        trendsContext,
        portfolioContext,
        visionAnalysis,
        products,
      );
    } else {
      response = buildMockResponse(message, hasImage, guest, visionAnalysis);
      if (products.length > 0) response.products = products;
    }

    response.blocks = enrichBlocksWithReferenceImages(response.blocks || [], referenceImages);

    if (guest && response.followUp) {
      response.followUp =
        'Modo invitado: esta consulta no se guarda. Crea cuenta para más análisis con Claude Vision.';
    }

    return new Response(JSON.stringify(response), { status: 200, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
};
