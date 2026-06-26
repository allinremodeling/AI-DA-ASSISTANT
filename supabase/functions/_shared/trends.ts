import { ALLIN_PORTFOLIO, matchPortfolio } from './portfolio.ts';

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

async function tavilySearch(query: string, maxResults = 4): Promise<TrendResult[]> {
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
    return (data.results || []).map(
      (r: { title: string; content: string; url: string; images?: string[] }) => ({
        title: r.title,
        text: r.content?.slice(0, 400) || '',
        imageUrl: r.images?.[0] || ALLIN_PORTFOLIO[0].imageUrl,
        source: (() => {
          try {
            return new URL(r.url).hostname.replace('www.', '');
          } catch {
            return r.url;
          }
        })(),
      }),
    );
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

/** Pinterest-style inspiration for Card 2. */
export async function searchInspirationReferences(query: string, lang = 'es'): Promise<TrendResult[]> {
  const langKeyword = lang === 'en'
    ? 'interior design inspiration pinterest houzz ideas'
    : 'inspiración diseño interiores cocina baño tendencias';
  const tavilyQuery = `${query} ${langKeyword} 2026`;
  const web = await tavilySearch(tavilyQuery, 4);
  if (web.length > 0) return web.slice(0, 3);

  const portfolio = matchPortfolio(query, 2).map((p) => ({
    title: p.title,
    text: p.text,
    imageUrl: p.imageUrl,
    source: p.source,
  }));

  return [...portfolio, ...matchCuratedTrends(query, 2)].slice(0, 3);
}

export { matchPortfolio, ALLIN_PORTFOLIO };
