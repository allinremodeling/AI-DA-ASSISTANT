import { matchCuratedTrends, searchDesignTrends, matchPortfolio } from './lib/trends';
import { analyzeImageWithClaude } from './lib/vision';
import { ALLIN_PORTFOLIO } from './lib/portfolio';
import { matchEcosystemServices, buildActionPlanSteps } from './lib/ecosystem';
import { searchSmartSlabListings, type SmartSlabRow } from './lib/smartslab';

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
  steps?: { step: number; title: string; description: string }[];
  ctaLabel?: string;
  ctaType?: string;
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
  url.searchParams.set('limit', '4');

  const res = await fetch(url.toString(), {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function polishIntroAndTexts(
  message: string,
  visionAnalysis: string,
  blocks: DesignBlock[],
): Promise<{ intro: string; followUp: string }> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your-key')) {
    return {
      intro: 'Tu consulta AI-DA está lista. Revisa cada sección y al final encontrarás el plan para hablar con un asesor All In.',
      followUp: '¿Listo para dar el siguiente paso? Usa los botones del plan de acción o responde con tus medidas y presupuesto objetivo.',
    };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Eres copywriter de AI-DA (All In Builders / All In Remodeling). Responde JSON: {"intro":"2 oraciones","followUp":"1 pregunta cierre"} en español, tono profesional y cercano.',
          },
          {
            role: 'user',
            content: `Consulta: ${message}\nAnálisis visual: ${visionAnalysis || 'N/A'}\nBloques: ${blocks.map((b) => b.title).join(', ')}`,
          },
        ],
        max_tokens: 300,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return JSON.parse(data.choices?.[0]?.message?.content);
    }
  } catch {
    // fallback below
  }

  return {
    intro: 'Análisis completo con referencias del ecosistema All In — listo para conectar con un asesor.',
    followUp: '¿Quieres que un asesor te contacte para cotización detallada?',
  };
}

function buildFourPillarBlocks(
  message: string,
  hasImage: boolean,
  guest: boolean,
  visionAnalysis: string,
  externalTrend: { title: string; text: string; imageUrl: string; source: string },
  portfolioItem: (typeof ALLIN_PORTFOLIO)[0],
  smartslab: SmartSlabRow,
  products: ProductRow[],
  services: { brand: string; name: string; url: string }[],
): DesignBlock[] {
  const productLine =
    products.length > 0
      ? `Productos All In Remodeling: ${products.map((p) => `${p.name} ($${p.price})`).join(', ')}. `
      : '';

  const serviceLine = services.map((s) => `${s.name} (${s.brand})`).join(' · ');

  return [
    {
      type: 'visual_analysis',
      title: hasImage ? 'Análisis de tu espacio' : 'Evaluación inicial',
      text:
        visionAnalysis
        || (hasImage
          ? 'Sube una foto nítida para activar Claude Vision. Mientras tanto evaluamos tu consulta con nuestro catálogo.'
          : `Analizamos tu consulta "${message.slice(0, 80)}" para alinearla con soluciones de cocina y baño en Georgia.`),
      tags: ['Claude Vision', 'AI-DA'],
    },
    {
      type: 'external_inspiration',
      title: externalTrend.title,
      text: `${externalTrend.text} Referencia de tendencia actual — mostrada aquí para que no tengas que salir del chat.`,
      imageUrl: externalTrend.imageUrl,
      source: externalTrend.source,
      tags: ['tendencia', 'referencia web'],
    },
    {
      type: 'ecosystem',
      title: `${portfolioItem.title} + SmartSlab ${smartslab.name}`,
      text: `${portfolioItem.text} · Proyecto real en ${portfolioItem.location}. Slab disponible: ${smartslab.name} (${smartslab.material}, ${smartslab.location}) desde $${smartslab.price}. ${productLine}Servicios: ${serviceLine}.`,
      imageUrl: portfolioItem.imageUrl,
      source: 'All In Remodeling · SmartSlab',
      tags: ['portfolio', 'smartslab', 'productos'],
    },
    {
      type: 'action_plan',
      title: 'Tu plan con All In — listo para hablar con un asesor',
      text: 'Te preparamos el camino para concretar tu remodelación. Un asesor puede retomar exactamente donde dejamos el chat.',
      steps: buildActionPlanSteps(guest),
      ctaLabel: guest ? 'Crear cuenta y agendar asesor' : 'Agendar consulta gratuita',
      ctaType: guest ? 'estimate' : 'virtual',
      tags: ['plan de acción', 'asesor'],
    },
  ];
}

function buildResponse(
  message: string,
  hasImage: boolean,
  guest: boolean,
  visionAnalysis: string,
  trends: { title: string; text: string; imageUrl: string; source: string }[],
  portfolio: (typeof ALLIN_PORTFOLIO),
  smartslabListings: SmartSlabRow[],
  products: ProductRow[],
) {
  const externalTrend = trends[0] || {
    title: 'Tendencia 2026: Calacatta & Waterfall Islands',
    text: 'Islas con cascada en cuarzo Calacatta y gabinetes shaker siguen liderando remodelaciones premium en Georgia.',
    imageUrl: ALLIN_PORTFOLIO[1].imageUrl,
    source: 'Industry trend',
  };

  const portfolioItem = portfolio[0] || ALLIN_PORTFOLIO[0];
  const smartslab = smartslabListings[0];
  const services = matchEcosystemServices(`${message} ${visionAnalysis}`, 3);

  const blocks = buildFourPillarBlocks(
    message,
    hasImage,
    guest,
    visionAnalysis,
    externalTrend,
    portfolioItem,
    smartslab,
    products,
    services,
  );

  return {
    blocks,
    products,
    smartslabListings,
    portfolioItem,
    externalTrend,
    services,
  };
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

    const contextQuery = `${message} ${visionAnalysis}`.slice(0, 500);
    const [trends, portfolio, smartslabListings] = await Promise.all([
      searchDesignTrends(contextQuery),
      Promise.resolve(matchPortfolio(contextQuery, 2)),
      searchSmartSlabListings(contextQuery, 3),
    ]);

    const productQuery =
      message.match(/cuarzo|quartz|gabinete|cabinet|shaker|encimera|counter|calacatta/i)?.[0]
      || message.slice(0, 40);
    const products = await searchProducts(productQuery);

    const built = buildResponse(
      message,
      hasImage,
      guest,
      visionAnalysis,
      trends,
      portfolio,
      smartslabListings,
      products,
    );

    const { intro, followUp } = await polishIntroAndTexts(message, visionAnalysis, built.blocks);

    const response = {
      intro,
      blocks: built.blocks,
      products: built.products,
      smartslabListings: built.smartslabListings,
      followUp: guest
        ? 'Modo invitado: crea cuenta AI-DA para guardar este diseño y continuar con un asesor All In.'
        : followUp,
    };

    return new Response(JSON.stringify(response), { status: 200, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
};
