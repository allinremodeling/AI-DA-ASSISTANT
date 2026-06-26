import { ALLIN_PORTFOLIO, matchPortfolio } from './portfolio.ts';

export const CURATED_TRENDS = [
  {
    title: 'Waterfall & Full-Height Backsplash',
    text: 'Encimeras con cascada y backsplash de piedra continua — tendencia fuerte en Georgia.',
    imageUrl: ALLIN_PORTFOLIO[1].imageUrl,
    source: 'All In Remodeling · Alpharetta',
    keywords: ['waterfall', 'backsplash', 'isla', 'cuarzo'],
  },
  {
    title: 'Calacatta Quartz Islands',
    text: 'Islas en cuarzo Calacatta con vetas dramáticas.',
    imageUrl: ALLIN_PORTFOLIO[1].imageUrl,
    source: 'All In Remodeling Portfolio',
    keywords: ['calacatta', 'cuarzo', 'quartz', 'isla'],
  },
  {
    title: 'Calacatta Gold Warmth',
    text: 'Calacatta Gold para cocinas tradicionales renovadas.',
    imageUrl: ALLIN_PORTFOLIO[2].imageUrl,
    source: 'All In Remodeling Portfolio',
    keywords: ['gold', 'calacatta', 'shaker'],
  },
];

export function matchCuratedTrends(query: string, limit = 4) {
  const q = query.toLowerCase();
  const scored = CURATED_TRENDS.map((trend) => {
    let score = 0;
    for (const kw of trend.keywords) {
      if (q.includes(kw)) score += 2;
    }
    return { trend, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

  if (scored.length >= limit) return scored.slice(0, limit).map((x) => x.trend);
  return CURATED_TRENDS.slice(0, limit);
}

export async function searchDesignTrends(query: string) {
  const portfolioFirst = matchPortfolio(query, 2).map((p) => ({
    title: p.title,
    text: p.text,
    imageUrl: p.imageUrl,
    source: p.source,
  }));

  const apiKey = Deno.env.get('TAVILY_API_KEY');
  if (apiKey) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query: `${query} kitchen bathroom design trends 2026`,
          search_depth: 'basic',
          include_images: true,
          max_results: 4,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const webResults = (data.results || []).map(
          (r: { title: string; content: string; url: string; images?: string[] }) => ({
            title: r.title,
            text: r.content?.slice(0, 400) || '',
            imageUrl: r.images?.[0] || ALLIN_PORTFOLIO[0].imageUrl,
            source: new URL(r.url).hostname.replace('www.', ''),
          }),
        );
        if (webResults.length > 0) return [...portfolioFirst, ...webResults].slice(0, 5);
      }
    } catch { /* fallback */ }
  }

  const curated = matchCuratedTrends(query).map((t) => ({
    title: t.title,
    text: t.text,
    imageUrl: t.imageUrl,
    source: t.source,
  }));

  return [...portfolioFirst, ...curated].slice(0, 5);
}

export { matchPortfolio, ALLIN_PORTFOLIO };
