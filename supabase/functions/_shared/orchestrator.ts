import { buildActionPlanSteps } from './ecosystem.ts';
import type { SmartSlabRow } from './smartslab.ts';
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
      imageUrl: insp.imageUrl,
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
      title: 'SmartSlab · matching inventory',
      text: ctx.smartslabListings.length
        ? `Slabs that may fit your project${ctx.dimensions.requiredSqft ? ` (~${ctx.dimensions.requiredSqft} sq ft)` : ''}: ${ctx.smartslabListings.map((s) => s.name).join(', ')}.`
        : 'Browse available slabs on SmartSlab marketplace.',
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
            content: `You are AI-DA, design assistant for ALL IN Builders & All In Remodeling (Georgia) + SmartSlab marketplace.

RULES:
1. The user's language code is provided in context.lang. Respond ENTIRELY in that language (intro, all blocks, followUp). Do not switch languages.
2. Return JSON: {"intro":"...","blocks":[...],"followUp":"..."}
3. Exactly 4 content blocks BEFORE action_plan will be merged — you may omit action_plan (we inject it).
4. Block types in order: analysis, inspiration, recommendation, marketplace
5. Card 1 (analysis): Start validating their project — paraphrase what they want, confirm understanding, summarize what web context suggests. Tone: "Ok, let me analyze..." equivalent in their language. Use visionAnalysis if present.
6. Card 2 (inspiration): Use inspirationWeb data — include imageUrl and source from context when available. Pinterest/Houzz style reference embedded in chat.
7. Card 3 (recommendation): Recommend specific All In products/services from context — NOT generic Calacatta unless user asked.
8. Card 4 (marketplace): Explain why listed SmartSlab slabs fit their dimensions/material needs. Reference smartslabListings by name, sqft, price.
9. Each block: {type, title, text, imageUrl?, source?, tags?[]}
10. Personalize every title and text to THIS specific query — never copy generic templates.
11. intro: 1-2 sentences acknowledging you're analyzing their project.
12. followUp: 1 engaging question to move toward advisor contact.`,
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

    blocks = blocks.map((b, i) => {
      const type = ['analysis', 'inspiration', 'recommendation', 'marketplace'][i] || b.type;
      const enriched = { ...b, type };

      if (type === 'inspiration' && !enriched.imageUrl && ctx.inspirationWeb[0]) {
        enriched.imageUrl = ctx.inspirationWeb[0].imageUrl;
        enriched.source = enriched.source || ctx.inspirationWeb[0].source;
      }
      if (type === 'recommendation' && !enriched.imageUrl) {
        const p = ctx.products[0] as Record<string, unknown> | undefined;
        enriched.imageUrl = String(p?.image_url || ctx.portfolioItem.imageUrl);
      }
      if (type === 'analysis' && (!enriched.text || enriched.text.length < 20)) {
        enriched.text = ctx.visionAnalysis
          || `Project: "${ctx.message.slice(0, 180)}" — ${ctx.dimensionsText}`;
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
