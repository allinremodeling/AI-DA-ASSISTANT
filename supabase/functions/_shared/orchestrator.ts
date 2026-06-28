import { buildActionPlanSteps } from './ecosystem.ts';
import { noSlabAdvisorMessage, type SmartSlabRow } from './smartslab.ts';
import type { TrendResult } from './trends.ts';
import { pickVariedInspiration, normalizeUrlKey, hashSeed } from './trends.ts';
import type { ProjectDimensions } from './dimensions.ts';
import type { ChatHistoryTurn } from './history.ts';
import { guestRefinementFollowUp, guestTurnsRemaining } from './history.ts';
import { completeDesignJSON } from './llm.ts';
import { AIDA_PERSONALITY, ORCHESTRATOR_JSON_RULES } from './personality.ts';

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
  guestTurn?: number;
  guestTurnLimit?: number;
  history: ChatHistoryTurn[];
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
  portfolioImages: string[];
  selectionSeed: string;
}

export interface OrchestratorResult {
  intro: string;
  blocks: DesignBlock[];
  followUp: string;
  editPhotoPrompt?: string;
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

function recommendationImageCandidates(ctx: OrchestratorContext, gptUrl?: string): string[] {
  const productUrls = ctx.products
    .map((p) => String((p as Record<string, unknown>).image_url || ''))
    .filter(Boolean);
  const unique = new Set<string>();
  const out: string[] = [];
  for (const url of [gptUrl, ...productUrls, ...ctx.portfolioImages, ctx.portfolioItem.imageUrl]) {
    if (!url || unique.has(url)) continue;
    unique.add(url);
    out.push(url);
  }
  return out;
}

function pickRecommendationImage(candidates: string[], inspirationUrl?: string, seed = ''): string | undefined {
  const inspKey = inspirationUrl ? normalizeUrlKey(inspirationUrl) : '';
  const valid = candidates.filter((url) => !inspKey || normalizeUrlKey(url) !== inspKey);
  const pool = valid.length > 0 ? valid : candidates;
  if (pool.length === 0) return undefined;
  return pool[hashSeed(seed || 'recommendation') % pool.length];
}

function isGenericBlockTitle(title: string, type: string): boolean {
  const t = title.trim().toLowerCase();
  return !t
    || t === type
    || t === 'kitchen analysis'
    || t === 'análisis de cocina'
    || t === 'project analysis'
    || t === 'analysis';
}

function buildAnalysisText(ctx: OrchestratorContext): string {
  const es = ctx.lang !== 'en';
  const parts: string[] = [];

  if (ctx.visionAnalysis) {
    parts.push(ctx.visionAnalysis.slice(0, 520));
  } else {
    parts.push(es
      ? `Entiendo que buscas: **${ctx.message.slice(0, 200)}**.`
      : `You asked about: **${ctx.message.slice(0, 200)}**.`);
  }

  if (ctx.dimensionsText) parts.push(ctx.dimensionsText);

  for (const web of ctx.analysisWeb.slice(0, 2)) {
    if (web.text) parts.push(web.text.slice(0, 220));
  }

  if (parts.length === 1 && ctx.analysisWeb[0]?.title) {
    parts.push(ctx.analysisWeb[0].title);
  }

  return parts.join('\n\n').slice(0, 950);
}

function localizedTitles(lang: string): Record<string, string> {
  const es = lang === 'en' ? false : true;
  return {
    analysis: es ? 'Tu proyecto — lo que entendemos' : 'Your project — what we understand',
    inspiration: es ? 'Inspiración para tu espacio' : 'Inspiration for your space',
    recommendation: es ? 'Recomendación All In' : 'All In recommendation',
    marketplace: es ? 'Smart Slab — full slab recomendado' : 'Smart Slab — recommended full slab',
  };
}

function buildFallbackBlocks(ctx: OrchestratorContext): DesignBlock[] {
  const titles = localizedTitles(ctx.lang);
  const exclude = recommendationImageCandidates(ctx);
  const inspRef = pickVariedInspiration(ctx.inspirationWeb, exclude, ctx.selectionSeed) || ctx.inspirationWeb[0];
  const insp = inspRef || {
    title: titles.inspiration,
    text: ctx.lang === 'es'
      ? 'Referencias visuales actuales para tu estilo — seleccionadas según tu consulta.'
      : 'Current visual references for your style — matched to your request.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&q=80',
    source: 'Unsplash',
  };
  const rec = ctx.products[0] as Record<string, unknown> | undefined;
  const serviceLine = ctx.services.map((s) => s.name).join(', ') || 'Virtual consultation, cabinets, countertops';

  return [
    {
      type: 'analysis',
      title: titles.analysis,
      text: ctx.visionAnalysis
        ? (ctx.lang === 'es'
          ? `Perfecto — revisé tu consulta${ctx.hasImage ? ' y la foto' : ''}. ${ctx.visionAnalysis.slice(0, 380)}`
          : `Got it — I reviewed your request${ctx.hasImage ? ' and photo' : ''}. ${ctx.visionAnalysis.slice(0, 380)}`)
        : (ctx.lang === 'es'
          ? `Entiendo que buscas: "${ctx.message.slice(0, 200)}". ${ctx.dimensionsText}. Contexto actual de remodelación en Georgia.`
          : `You asked about: "${ctx.message.slice(0, 200)}". ${ctx.dimensionsText}. Current Georgia remodeling context.`),
      tags: ['AI-DA', 'análisis'],
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
      title: rec ? String(rec.name) : titles.recommendation,
      text: rec
        ? `${rec.description || 'Product from All In Remodeling catalog.'} Services: ${serviceLine}.`
        : `All In Remodeling and All In Builders can help with: ${serviceLine}.`,
      imageUrl: rec
        ? pickRecommendationImage([String(rec.image_url || ''), ...ctx.portfolioImages], insp.imageUrl, ctx.selectionSeed)
        : pickRecommendationImage(ctx.portfolioImages.length ? ctx.portfolioImages : [ctx.portfolioItem.imageUrl], insp.imageUrl, ctx.selectionSeed),
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

  if (!plan.title) {
    plan.title = lang === 'es' ? 'Plan con All In — hablar con un asesor' : 'Plan with All In — talk to an advisor';
  }
  if (!plan.text) {
    plan.text = lang === 'es' ? 'Pasos para concretar tu remodelación.' : 'Steps to finalize your remodel with our team.';
  }
  plan.steps = buildActionPlanSteps(guest, lang);
  if (!plan.ctaLabel) plan.ctaLabel = guest
    ? (lang === 'es' ? 'Crear cuenta y agendar' : 'Create account & schedule')
    : (lang === 'es' ? 'Agendar consulta gratuita' : 'Schedule free consultation');
  if (!plan.ctaType) plan.ctaType = guest ? 'estimate' : 'virtual';

  return [...withoutPlan.slice(0, 4), plan];
}

const ORCHESTRATOR_SYSTEM = `${AIDA_PERSONALITY}

${ORCHESTRATOR_JSON_RULES}

STRUCTURE — exactly 4 blocks (types in order): analysis, inspiration, recommendation, marketplace. We inject action_plan separately.

CARD 1 analysis: REQUIRED field "text" with 120+ characters — 2 short paragraphs, **bold** key materials/styles, blend visionAnalysis + dimensions + analysisWeb from context. Never leave text empty. Title in user's language (not "Kitchen Analysis").
CARD 2 inspiration: align with selectedInspiration in context; no imageUrl in JSON.
CARD 3 recommendation: All In products/services for Georgia — specific and justified.
CARD 4 marketplace: ONE full slab from smartslabListings or advisor message if empty.

followUp: natural question; expressTurnsRemaining in context — on last turn invite free account.`;

function normalizeParsedBlock(raw: Record<string, unknown>, index: number): DesignBlock {
  const text = String(raw.text || raw.content || raw.body || '').trim();
  return {
    type: String(raw.type || ['analysis', 'inspiration', 'recommendation', 'marketplace'][index] || 'analysis'),
    title: String(raw.title || '').trim(),
    text,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
    source: typeof raw.source === 'string' ? raw.source : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags as string[] : undefined,
    steps: Array.isArray(raw.steps) ? raw.steps as DesignBlock['steps'] : undefined,
    ctaLabel: typeof raw.ctaLabel === 'string' ? raw.ctaLabel : undefined,
    ctaType: typeof raw.ctaType === 'string' ? raw.ctaType : undefined,
  };
}

function finalizeBlocks(
  blocks: DesignBlock[],
  ctx: OrchestratorContext,
  inspRef: TrendResult | undefined,
): DesignBlock[] {
  const titles = localizedTitles(ctx.lang);
  const inspirationImageUrl = inspRef?.imageUrl;

  return blocks.map((b, i) => {
    const type = ['analysis', 'inspiration', 'recommendation', 'marketplace'][i] || b.type;
    const enriched: DesignBlock = { ...b, type };

    if (type === 'analysis') {
      if (!enriched.text || enriched.text.length < 80) {
        enriched.text = buildAnalysisText(ctx);
      }
      if (isGenericBlockTitle(enriched.title, type)) {
        enriched.title = titles.analysis;
      }
    }

    if (!enriched.title || enriched.title === type) {
      enriched.title = titles[type] || enriched.title;
    }

    if (type === 'inspiration' && inspRef) {
      enriched.imageUrl = inspRef.imageUrl;
      enriched.source = inspRef.source || enriched.source;
      if (!enriched.text || enriched.text.length < 30) enriched.text = inspRef.text;
      if (enriched.title === 'Inspiration for your space' || enriched.title === type) {
        enriched.title = inspRef.title || titles.inspiration;
      }
    }

    if (type === 'recommendation') {
      const recImage = pickRecommendationImage(
        recommendationImageCandidates(ctx, enriched.imageUrl),
        inspirationImageUrl,
        ctx.selectionSeed,
      );
      if (recImage) enriched.imageUrl = recImage;
      else delete enriched.imageUrl;
    }

    if (type === 'marketplace') {
      enriched.text = ctx.smartslabListings.length === 0
        ? noSlabAdvisorMessage(ctx.lang)
        : marketplaceBlockText(ctx);
    }

    return enriched;
  });
}

export async function orchestrateChatResponse(ctx: OrchestratorContext): Promise<OrchestratorResult> {
  const inspRef = pickVariedInspiration(
    ctx.inspirationWeb,
    recommendationImageCandidates(ctx),
    ctx.selectionSeed,
  ) || ctx.inspirationWeb[0];

  const contextPayload = {
    userMessage: ctx.message,
    conversationHistory: ctx.history,
    guestTurn: ctx.guestTurn,
    lang: ctx.lang,
    hasImage: ctx.hasImage,
    visionAnalysis: ctx.visionAnalysis || null,
    searchDate: ctx.searchDate,
    dimensions: ctx.dimensionsText,
    analysisWeb: ctx.analysisWeb.slice(0, 2),
    selectedInspiration: inspRef ? {
      title: inspRef.title,
      text: inspRef.text,
      source: inspRef.source,
    } : null,
    inspirationWeb: ctx.inspirationWeb.slice(0, 2),
    products: ctx.products.slice(0, 4),
    services: ctx.services,
    smartslabListings: ctx.smartslabListings,
    portfolio: ctx.portfolioItem,
    editPhotoAvailable: ctx.hasImage && Boolean(Deno.env.get('REPLICATE_API_TOKEN')),
    expressTurnsRemaining: ctx.guest
      ? guestTurnsRemaining(ctx.guestTurn ?? 1, ctx.guestTurnLimit ?? 3)
      : null,
  };

  try {
    const { content: rawJson } = await completeDesignJSON(
      ORCHESTRATOR_SYSTEM,
      JSON.stringify(contextPayload),
      ctx.history,
    );

    const parsed = JSON.parse(rawJson || '{}');
    let blocks: DesignBlock[] = Array.isArray(parsed.blocks)
      ? parsed.blocks.map((b: Record<string, unknown>, i: number) => normalizeParsedBlock(b, i))
      : [];

    if (blocks.length < 4) {
      blocks = buildFallbackBlocks(ctx).slice(0, 4);
    } else {
      blocks = finalizeBlocks(blocks.slice(0, 4), ctx, inspRef);
    }

    blocks = injectActionPlan(blocks, ctx.guest, ctx.lang);

    const defaultIntro = ctx.lang === 'es'
      ? 'Listo — organicé todo para que veas análisis, inspiración visual, recomendación All In y tu slab en SmartSlab.'
      : 'Done — I organized analysis, visual inspiration, All In recommendation, and your SmartSlab match.';

    const editPhotoPrompt = typeof parsed.editPhoto?.prompt === 'string'
      ? parsed.editPhoto.prompt.trim()
      : undefined;

    return {
      intro: parsed.intro || defaultIntro,
      blocks,
      followUp: parsed.followUp || (ctx.guest
        ? guestRefinementFollowUp(ctx.lang, guestTurnsRemaining(ctx.guestTurn ?? 1, ctx.guestTurnLimit ?? 3))
        : (ctx.lang === 'es' ? '¿Te gustaría que un asesor All In revise esto contigo en una consulta gratuita?' : 'Would you like an All In advisor to review this with you in a free consultation?')),
      editPhotoPrompt: editPhotoPrompt || undefined,
    };
  } catch (err) {
    console.error('Orchestrator fallback', err);
    const blocks = injectActionPlan(buildFallbackBlocks(ctx), ctx.guest, ctx.lang);
    return {
      intro: ctx.lang === 'es'
        ? 'Te preparé una respuesta con lo que comentaste — mira cada sección y dime si quieres ajustar algo.'
        : 'I put together a response based on what you shared — review each section and tell me if you want to adjust anything.',
      blocks,
      followUp: ctx.guest
        ? guestRefinementFollowUp(ctx.lang, guestTurnsRemaining(ctx.guestTurn ?? 1, ctx.guestTurnLimit ?? 3))
        : (ctx.lang === 'es' ? '¿Quieres que un asesor All In te contacte?' : 'Would you like an All In advisor to reach out?'),
    };
  }
}
