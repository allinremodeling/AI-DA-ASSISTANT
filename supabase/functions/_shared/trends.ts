import { ALLIN_PORTFOLIO, matchPortfolio } from './portfolio.ts';
import { buildInspirationImageQuery } from './keywords.ts';

export interface TrendResult {
  title: string;
  text: string;
  imageUrl: string;
  source: string;
}

export const CURATED_TRENDS = [
  {
    title: 'Waterfall & Full-Height Backsplash',
    text: 'Continuous stone backsplash with waterfall island edges — strong trend in Georgia premium kitchens.',
    imageUrl: ALLIN_PORTFOLIO[1].imageUrl,
    source: 'All In Remodeling · Alpharetta',
    keywords: ['waterfall', 'backsplash', 'isla', 'island', 'cuarzo'],
  },
  {
    title: 'Warm Minimal Shaker',
    text: 'Greige shaker cabinets with subtle quartz veining and warm under-cabinet lighting.',
    imageUrl: ALLIN_PORTFOLIO[0].imageUrl,
    source: 'Design trend 2026',
    keywords: ['minimal', 'shaker', 'warm', 'moderno', 'modern'],
  },
  {
    title: 'Two-Tone Cabinet Contrast',
    text: 'Light uppers with navy, forest green, or matte black bases for depth in compact kitchens.',
    imageUrl: ALLIN_PORTFOLIO[2].imageUrl,
    source: 'Houzz trend',
    keywords: ['two-tone', 'contrast', 'navy', 'green', 'gabinete'],
  },
];

/** External inspiration only — never All In portfolio URLs (Card 3 owns those). */
const EXTERNAL_INSPIRATION: (TrendResult & { keywords: string[] })[] = [
  {
    title: 'Modern Minimal Kitchen',
    text: 'Clean lines, handleless cabinets and quartz waterfall island — reference from current interior design publications.',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=900&q=80',
    source: 'Unsplash · Interior design',
    keywords: ['modern', 'minimal', 'blanco', 'white', 'contemporary'],
  },
  {
    title: 'Calacatta-Style Quartz Kitchen',
    text: 'White quartz with grey veining, brass fixtures and warm wood accents — highly pinned on Houzz and Pinterest.',
    imageUrl: 'https://images.unsplash.com/photo-1565538420870-da08ff96a207?w=900&q=80',
    source: 'Unsplash · Kitchen inspiration',
    keywords: ['calacatta', 'cuarzo', 'quartz', 'veta', 'vein', 'marble'],
  },
  {
    title: 'Dark Cabinet Contrast',
    text: 'Navy or charcoal lowers with light uppers — two-tone kitchens trending in 2026 remodel searches.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
    source: 'Unsplash · Houzz-style',
    keywords: ['navy', 'negro', 'black', 'two-tone', 'contrast', 'dark'],
  },
  {
    title: 'Spa Bathroom Vanity',
    text: 'Floating vanity, large-format tile and matte black fixtures — spa bathroom reference from design magazines.',
    imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=900&q=80',
    source: 'Unsplash · Bathroom design',
    keywords: ['baño', 'bath', 'bathroom', 'spa', 'vanity', 'vanidad'],
  },
  {
    title: 'Open Kitchen with Island',
    text: 'Open-plan layout with oversized island and layered lighting — common in Georgia premium remodels.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80',
    source: 'Unsplash · Open kitchen',
    keywords: ['isla', 'island', 'open', 'cocina', 'kitchen', 'remodel'],
  },
  {
    title: 'Warm Farmhouse Kitchen',
    text: 'Shaker cabinets, open shelving and natural stone counters — farmhouse-modern crossover trend.',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&q=80',
    source: 'Unsplash · Farmhouse modern',
    keywords: ['farmhouse', 'shaker', 'warm', 'wood', 'rustic'],
  },
];

const INTERNAL_HOSTS = ['allinremodeling.us', 'allinbuilders.us', 'smartslab.app'];

function normalizeUrlKey(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function isInternalBrandUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return INTERNAL_HOSTS.some((h) => host.includes(h));
  } catch {
    return false;
  }
}

function isExcludedUrl(url: string, excludeUrls: string[] = []): boolean {
  const key = normalizeUrlKey(url);
  return excludeUrls.some((ex) => ex && normalizeUrlKey(ex) === key);
}

function matchCuratedTrends(query: string, limit = 3): TrendResult[] {
  const q = query.toLowerCase();
  const scored = CURATED_TRENDS.map((trend) => {
    let score = 0;
    for (const kw of trend.keywords) {
      if (q.includes(kw)) score += 2;
    }
    return { trend, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

  const picked = scored.length > 0
    ? scored.slice(0, limit).map((x) => ({
      title: x.trend.title,
      text: x.trend.text,
      imageUrl: x.trend.imageUrl,
      source: x.trend.source,
    }))
    : CURATED_TRENDS.slice(0, limit).map((t) => ({
      title: t.title,
      text: t.text,
      imageUrl: t.imageUrl,
      source: t.source,
    }));

  return picked;
}

function matchExternalInspiration(query: string, keywords: string[] = [], limit = 3): TrendResult[] {
  const q = `${query} ${keywords.join(' ')}`.toLowerCase();
  const scored = EXTERNAL_INSPIRATION.map((item) => {
    let score = 0;
    for (const kw of item.keywords) {
      if (q.includes(kw)) score += 3;
    }
    for (const kw of keywords) {
      if (item.keywords.some((ik) => ik.includes(kw.toLowerCase()) || kw.toLowerCase().includes(ik))) {
        score += 2;
      }
    }
    return { item, score };
  }).sort((a, b) => b.score - a.score);

  const picked = scored.filter((x) => x.score > 0).map((x) => ({
    title: x.item.title,
    text: x.item.text,
    imageUrl: x.item.imageUrl,
    source: x.item.source,
  }));

  if (picked.length >= limit) return picked.slice(0, limit);
  const fallback = EXTERNAL_INSPIRATION.map(({ title, text, imageUrl, source }) => ({
    title, text, imageUrl, source,
  }));
  return [...picked, ...fallback].slice(0, limit);
}

interface TavilyOptions {
  excludeUrls?: string[];
  externalOnly?: boolean;
}

async function tavilySearch(query: string, maxResults = 4, options: TavilyOptions = {}): Promise<TrendResult[]> {
  const apiKey = Deno.env.get('TAVILY_API_KEY');
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_images: true,
        max_results: maxResults,
      }),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const results: TrendResult[] = [];

    for (const r of data.results || []) {
      const row = r as { title: string; content: string; url: string; images?: string[] };
      const imageCandidates = (row.images || []).filter(Boolean);
      const imageUrl = imageCandidates.find((img) =>
        !isInternalBrandUrl(img)
        && !isExcludedUrl(img, options.excludeUrls),
      );

      if (options.externalOnly && (!imageUrl || isInternalBrandUrl(row.url))) continue;
      if (!imageUrl) continue;

      if (isExcludedUrl(imageUrl, options.excludeUrls)) continue;

      results.push({
        title: row.title,
        text: row.content?.slice(0, 400) || '',
        imageUrl,
        source: (() => {
          try {
            return new URL(row.url).hostname.replace('www.', '');
          } catch {
            return row.url;
          }
        })(),
      });
    }

    return results;
  } catch {
    return [];
  }
}

/** Web context for Card 1 — remodeling trends + Georgia context. */
export async function searchAnalysisContext(query: string, searchDate: string, lang = 'es'): Promise<TrendResult[]> {
  const langKeyword = lang === 'en' ? 'design ideas' : 'tendencias diseño';
  const tavilyQuery = `${query} kitchen bathroom remodeling ${langKeyword} Georgia surfaces materials ${searchDate}`;
  const web = await tavilySearch(tavilyQuery, 3);
  if (web.length > 0) return web;

  return matchPortfolio(query, 2).map((p) => ({
    title: p.title,
    text: p.text,
    imageUrl: p.imageUrl,
    source: p.source,
  }));
}

export interface InspirationSearchOptions {
  keywords?: string[];
  excludeUrls?: string[];
  lang?: string;
}

/** External web inspiration for Card 2 — keywords from analysis, no All In portfolio images. */
export async function searchInspirationReferences(
  query: string,
  lang = 'es',
  options: InspirationSearchOptions = {},
): Promise<TrendResult[]> {
  const keywords = options.keywords || [];
  const excludeUrls = options.excludeUrls || [];
  const imageQuery = buildInspirationImageQuery(keywords.length ? keywords : [query.slice(0, 80)], lang);

  const queries = [
    `${imageQuery} site:houzz.com OR site:pinterest.com OR site:architecturaldigest.com`,
    `${imageQuery} interior design photos ideas`,
  ];

  const merged: TrendResult[] = [];
  const seenImages = new Set<string>();

  for (const q of queries) {
    const batch = await tavilySearch(q, 5, { excludeUrls, externalOnly: true });
    for (const item of batch) {
      const key = normalizeUrlKey(item.imageUrl);
      if (seenImages.has(key) || isExcludedUrl(item.imageUrl, excludeUrls)) continue;
      seenImages.add(key);
      merged.push(item);
    }
    if (merged.length >= 3) break;
  }

  if (merged.length > 0) {
    return merged.slice(0, 3);
  }

  const external = matchExternalInspiration(query, keywords, 3)
    .filter((r) => !isExcludedUrl(r.imageUrl, excludeUrls));

  return external.length > 0 ? external : matchExternalInspiration('', keywords, 2);
}

export function pickUniqueInspiration(
  refs: TrendResult[],
  excludeUrls: string[] = [],
): TrendResult | undefined {
  return refs.find((r) =>
    r.imageUrl
    && !isExcludedUrl(r.imageUrl, excludeUrls)
    && !isInternalBrandUrl(r.imageUrl),
  ) || refs.find((r) => r.imageUrl && !isExcludedUrl(r.imageUrl, excludeUrls));
}

export { matchPortfolio, ALLIN_PORTFOLIO, normalizeUrlKey, isExcludedUrl };
