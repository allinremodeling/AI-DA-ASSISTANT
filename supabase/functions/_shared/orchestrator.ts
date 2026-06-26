import { buildActionPlanSteps } from './ecosystem.ts';
import { noSlabAdvisorMessage, type SmartSlabRow } from './smartslab.ts';
import type { TrendResult } from './trends.ts';
import type { ProjectDimensions } from './dimensions.ts';

export interface DesignBlock {
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

export interface OrchestratorContext {
  message: string;
  guest: boolean;
  hasImage: boolean;
  lang: string;
  visionAnalysis: string;
  searchDate: string;
  dimensions: ProjectDimensions;
  dimensionsText: string;
  analysisWeb: TrendResult[];
  inspirationWeb: TrendResult[];
  products: Record<string, unknown>[];
  services: { brand: string; name: string; url: string }[];
  smartslabListings: SmartSlabRow[];
  portfolioItem: { title: string; text: string; imageUrl: string; source: string };
}

export interface OrchestratorResult {
  intro: string;
  blocks: DesignBlock[];
  followUp: string;
}

function marketplaceBlockText(ctx: OrchestratorContext): string {
  const slab = ctx.smartslabListings[0];
  if (!slab) return noSlabAdvisorMessage(ctx.lang);

  const sqftNote = ctx.dimensions.requiredSqft ? ` (~${ctx.dimensions.requiredSqft} sq ft needed)` : '';
  const templates: Record<string, string> = {
    es: `Full slab recomendado: ${slab.name} (${slab.material}, ${slab.sqft} sq ft, $${slab.price})${sqftNote}. Disponible en SmartSlab — ${slab.location}.`,
    en: `Recommended full slab: ${slab.name} (${slab.material}, ${slab.sqft} sq ft, $${slab.price})${sqftNote}. Available on SmartSlab — ${slab.location}.`,
    pt: `Full slab recomendado: ${slab.name} (${slab.material}, ${slab.sqft} sq ft, $${slab.price})${sqftNote}. Disponível no SmartSlab — ${slab.location}.`,
    fr: `Full slab recommandé : ${slab.name} (${slab.material}, ${slab.sqft} sq ft, $${slab.price})${sqftNote}. Disponible sur SmartSlab — ${slab.location}.`,
  };
  return templates[ctx.lang] || templates.en;
}
function buildFallbackBlocks(ctx: OrchestratorContext): DesignBlock[] {
  const insp = ctx.inspirationWeb[0] || ctx.portfolioItem;
  const rec = ctx.products[0] as Record<string, unknown> | undefined;
  const serviceLine = ctx.services.map((s) => s.name).join(', ') || 'Virtual consultation, cabinets, countertops';

  return [
    {
      type: 'analysis',
      title: 'Your project — our understanding',
      text: ctx.visionAnalysis
        ? `Based on your photo and message: ${ctx.visionAnalysis.slice(0, 350)}`
        : `You asked about: "${ctx.message.slice(0, 200)}". ${ctx.dimensionsText}. We found current remodeling context from ${ctx.analysisWeb[0]?.source || 'All In portfolio'}.`,
      tags: ['AI-DA', 'analysis'],
    },
    {
      type: 'inspiration',
      title: insp.title,
      text: insp.text,
      source: insp.source,
      tags: ['inspiration'],
    },
    {
      type: 'recommendation',
      title: rec ? String(rec.name) : 'All In ecosystem recommendation',
      text: rec
        ? `${rec.description || 'Product from All In Remodeling catalog.'} Services: ${serviceLine}.`
        : `All In Remodeling and All In Builders can help with: ${serviceLine}.`,
      imageUrl: rec ? String(rec.image_url || ctx.portfolioItem.imageUrl) : ctx.portfolioItem.imageUrl,
      source: 'All In Remodeling · All In Builders',
      tags: ['recommendation'],
    },
    {
      type: 'marketplace',
      title: ctx.lang === 'es' ? 'SmartSlab · full slab disponible' : 'SmartSlab · available full slab',
      text: marketplaceBlockText(ctx),
      tags: ['SmartSlab', 'marketplace'],
    },
    {
      type: 'action_plan',
      title: ctx.lang === 'es' ? 'Plan con All In — hablar con un asesor' : 'Plan with All In — talk to an advisor',
      text: ctx.lang === 'es' ? 'Pasos para concretar tu remodelación con nuestro equipo.' : 'Steps to move forward with our team.',
      steps: buildActionPlanSteps(ctx.guest, ctx.lang),
      ctaLabel: ctx.guest
        ? (ctx.lang === 'es' ? 'Crear cuenta y agendar' : 'Create account & schedule')
        : (ctx.lang === 'es' ? 'Agendar consulta gratuita' : 'Schedule free consultation'),
      ctaType: ctx.guest ? 'estimate' : 'virtual',
      tags: ['advisor'],
    },
  ];
}

function injectActionPlan(blocks: DesignBlock[], guest: boolean, lang = 'es'): DesignBlock[] {
  const withoutPlan = blocks.filter((b) => b.type !== 'action_plan');
  const existingPlan = blocks.find((b) => b.type === 'action_plan');

  const plan: DesignBlock = existingPlan ?? {
    type: 'action_plan',
    title: lang === 'es' ? 'Plan con All In — hablar con un asesor' : 'Plan with All In — talk to an advisor',
    text: lang === 'es' ? 'Pasos para concretar tu remodelación.' : 'Steps to finalize your remodel with our team.',
    steps: buildActionPlanSteps(guest, lang),
    ctaLabel: guest
      ? (lang === 'es' ? 'Crear cuenta y agendar' : 'Create account & schedule')
      : (lang === 'es' ? 'Agendar consulta gratuita' : 'Schedule free consultation'),
    ctaType: guest ? 'estimate' : 'virtual',
    tags: ['advisor'],
  };

  plan.steps = buildActionPlanSteps(guest, lang);
  if (!plan.ctaLabel) plan.ctaLabel = guest
    ? (lang === 'es' ? 'Crear cuenta y agendar' : 'Create account & schedule')
    : (lang === 'es' ? 'Agendar consulta gratuita' : 'Schedule free consultation');
  if (!plan.ctaType) plan.ctaType = guest ? 'estimate' : 'virtual';

  return [...withoutPlan.slice(0, 4), plan];
}

export async function orchestrateChatResponse(ctx: OrchestratorContext): Promise<OrchestratorResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_CHAT_MODEL') || 'gpt-4o-mini';

  const contextPayload = {
    userMessage: ctx.message,
    lang: ctx.lang,
    hasImage: ctx.hasImage,
    visionAnalysis: ctx.visionAnalysis || null,
    searchDate: ctx.searchDate,
    dimensions: ctx.dimensionsText,
    analysisWeb: ctx.analysisWeb,
    inspirationWeb: ctx.inspirationWeb,
    products: ctx.products.slice(0, 4),
    services: ctx.services,
    smartslabListings: ctx.smartslabListings,
    portfolio: ctx.portfolioItem,
  };

  if (!apiKey || apiKey.includes('your-key')) {
    const blocks = buildFallbackBlocks(ctx);
    return {
      intro: ctx.lang === 'es'
        ? 'Tu consulta AI-DA está lista. Revisa cada sección — el plan de acción al final te conecta con un asesor All In.'
        : 'Your AI-DA consultation is ready. Review each section — the action plan at the end connects you with an All In advisor.',
      blocks,
      followUp: ctx.guest
        ? (ctx.lang === 'es' ? 'Modo invitado: crea una cuenta gratuita para continuar con un asesor.' : 'Guest mode: create a free account to continue with an advisor.')
        : (ctx.lang === 'es' ? '¿Listo para agendar una consulta virtual o recibir una cotización?' : 'Ready to schedule a virtual consultation or get a detailed quote?'),
    };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2200,
        messages: [
          {
            role: 'system',
            content: `You are AI-DA, a professional interior/surface design consultant for ALL IN Builders, All In Remodeling (Georgia) and SmartSlab marketplace.

CRITICAL RULES:
1. Use context.lang — respond ENTIRELY in that language (intro, blocks, followUp). Never switch languages.
2. Return JSON: {"intro":"...","blocks":[...],"followUp":"..."}
3. Provide exactly 4 blocks with types in order: analysis, inspiration, recommendation, marketplace (action_plan is injected by us — omit it).
4. CARD 1 analysis: Start like "Ok, let me analyze your project..." (in user's language). Paraphrase what the user wants, validate intent, combine visionAnalysis + analysisWeb + dimensions. Must feel personal — never generic.
5. CARD 2 inspiration: TEXT ONLY — do NOT include imageUrl. Short inspiration from Pinterest/Houzz/ArchDaily trends in inspirationWeb. Describe styles, palettes, finishes, combinations.
6. CARD 3 recommendation: Recommend All In products/services from context (quartz, granite, marble, porcelain, cabinets, waterfall island, fabrication, installation). Only business-relevant offerings. Include imageUrl from products or portfolio when available.
7. CARD 4 marketplace: Show exactly ONE full slab from smartslabListings (never remnants). Explain why it fits (material, sq ft, application). If smartslabListings is empty, tell the user in their language that no matching full slab was found and an All In advisor will guide them — point to the action plan below. Do not invent listings.
8. Write like a professional design consultant — clear, natural, not robotic. No endless bullet lists.
9. NEVER reuse the same phrases across different queries. Personalize from userMessage, vision, web data, products, slabs.
10. intro: 1-2 sentences — user must feel you are actively researching (searchDate in context).
11. followUp: one question toward speaking with an All In advisor.`,
          },
          {
            role: 'user',
            content: JSON.stringify(contextPayload),
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error('Orchestrator error', res.status, await res.text());
      throw new Error('OpenAI orchestrator failed');
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    let blocks: DesignBlock[] = Array.isArray(parsed.blocks) ? parsed.blocks : [];

    const FALLBACK_TITLES: Record<string, Record<string, string>> = {
      analysis: { es: 'Tu proyecto — lo que entendemos', en: 'Your project — what we understand' },
      inspiration: { es: 'Inspiración para tu espacio', en: 'Inspiration for your space' },
      recommendation: { es: 'Recomendación All In', en: 'All In recommendation' },
      marketplace: { es: 'Smart Slab — inventario disponible', en: 'Smart Slab — available inventory' },
    };
    const FALLBACK_TEXTS: Record<string, Record<string, string>> = {
      recommendation: { es: `Servicios disponibles: ${ctx.services.map((s) => s.name).join(', ')}.`, en: `Available services: ${ctx.services.map((s) => s.name).join(', ')}.` },
      marketplace: {
        es: marketplaceBlockText(ctx),
        en: marketplaceBlockText(ctx),
      },
    };

    blocks = blocks.map((b, i) => {
      const type = ['analysis', 'inspiration', 'recommendation', 'marketplace'][i] || b.type;
      const lang = ctx.lang === 'en' ? 'en' : 'es';
      const enriched = { ...b, type };

      if (!enriched.title) enriched.title = FALLBACK_TITLES[type]?.[lang] || type;
      if (!enriched.text && FALLBACK_TEXTS[type]) enriched.text = FALLBACK_TEXTS[type][lang];

      if (type === 'inspiration') {
        delete enriched.imageUrl;
        if (!enriched.source && ctx.inspirationWeb[0]) enriched.source = ctx.inspirationWeb[0].source;
        if (!enriched.text && ctx.inspirationWeb[0]) enriched.text = ctx.inspirationWeb[0].text;
      }
      if (type === 'recommendation' && !enriched.imageUrl) {
        const p = ctx.products[0] as Record<string, unknown> | undefined;
        enriched.imageUrl = String(p?.image_url || ctx.portfolioItem.imageUrl);
      }
      if (type === 'marketplace') {
        if (ctx.smartslabListings.length === 0) {
          enriched.text = noSlabAdvisorMessage(ctx.lang);
        } else if (!enriched.text) {
          enriched.text = marketplaceBlockText(ctx);
        }
      }
      if (type === 'analysis' && (!enriched.text || enriched.text.length < 20)) {
        enriched.text = ctx.visionAnalysis
          || `${lang === 'es' ? 'Proyecto' : 'Project'}: "${ctx.message.slice(0, 180)}" — ${ctx.dimensionsText}`;
      }
      return enriched;
    });

    if (blocks.length < 4) {
      blocks = buildFallbackBlocks(ctx).slice(0, 4);
    }

    blocks = injectActionPlan(blocks, ctx.guest, ctx.lang);

    return {
      intro: parsed.intro || (ctx.lang === 'es' ? 'Análisis completo — revisa cada sección.' : 'Analysis complete — review each section below.'),
      blocks,
      followUp: parsed.followUp || (ctx.guest
        ? (ctx.lang === 'es' ? 'Crea una cuenta para continuar con un asesor All In.' : 'Create an account to continue with an All In advisor.')
        : (ctx.lang === 'es' ? '¿Te gustaría agendar una consulta virtual gratuita?' : 'Would you like to schedule a free virtual consultation?')),
    };
  } catch (err) {
    console.error('Orchestrator fallback', err);
    const blocks = buildFallbackBlocks(ctx);
    return {
      intro: ctx.lang === 'es' ? 'Tu consulta AI-DA está lista.' : 'Your AI-DA consultation is ready.',
      blocks,
      followUp: ctx.lang === 'es' ? '¿Te gustaría que un asesor All In te contacte?' : 'Would you like an All In advisor to contact you?',
    };
  }
}
