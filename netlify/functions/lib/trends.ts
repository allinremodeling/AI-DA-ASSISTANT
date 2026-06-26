import { ALLIN_PORTFOLIO, matchPortfolio } from './portfolio';

export interface TrendReference {
  title: string;
  text: string;
  imageUrl: string;
  source: string;
  keywords: string[];
}

export const CURATED_TRENDS: TrendReference[] = [
  {
    title: 'Waterfall & Full-Height Backsplash',
    text: 'Encimeras con cascada (waterfall) y backsplash de piedra continua — tendencia fuerte en cocinas premium de Georgia según proyectos All In.',
    imageUrl: ALLIN_PORTFOLIO[1].imageUrl,
    source: 'All In Remodeling · Alpharetta',
    keywords: ['waterfall', 'backsplash', 'isla', 'cuarzo', 'premium'],
  },
  {
    title: 'Calacatta Quartz Islands',
    text: 'Islas centrales en cuarzo Calacatta con vetas dramáticas. Combinación #1 en remodelaciones de Alpharetta y Lawrenceville.',
    imageUrl: ALLIN_PORTFOLIO[1].imageUrl,
    source: 'All In Remodeling Portfolio',
    keywords: ['calacatta', 'cuarzo', 'quartz', 'isla', 'blanco', 'veta'],
  },
  {
    title: 'Calacatta Gold Warmth',
    text: 'Cuarzo Calacatta Gold aporta calidez sin perder elegancia. Ideal para transicionar cocinas tradicionales a look contemporáneo.',
    imageUrl: ALLIN_PORTFOLIO[2].imageUrl,
    source: 'All In Remodeling Portfolio',
    keywords: ['gold', 'dorado', 'calacatta', 'shaker', 'moderno', 'calido'],
  },
  {
    title: 'Golden Carrara Elegance',
    text: 'Tonos Carrara con vetas suaves en cocinas de estilo clásico-renovado. Muy solicitado en proyectos residenciales de Georgia.',
    imageUrl: ALLIN_PORTFOLIO[3].imageUrl,
    source: 'All In Remodeling Portfolio',
    keywords: ['carrara', 'marmol', 'marble', 'clasico', 'elegante'],
  },
  {
    title: 'Spa Bathroom Vanities',
    text: 'Vanidades flotantes con piedra premium, grifería negro mate y azulejo grande formato — estándar en baños tipo spa.',
    imageUrl: ALLIN_PORTFOLIO[4].imageUrl,
    source: 'All In Remodeling · Tennessee',
    keywords: ['bano', 'bath', 'spa', 'vanidad', 'vanity', 'baño'],
  },
  {
    title: 'Full Kitchen Transformations',
    text: 'Remodelación integral: gabinetes nuevos + encimeras de piedra + iluminación en capas. Máximo ROI en reventa.',
    imageUrl: ALLIN_PORTFOLIO[0].imageUrl,
    source: 'All In Remodeling Portfolio',
    keywords: ['remodel', 'cocina', 'integral', 'transform', 'kitchen'],
  },
];

export function matchCuratedTrends(query: string, limit = 4): TrendReference[] {
  const q = query.toLowerCase();
  const scored = CURATED_TRENDS.map((trend) => {
    let score = 0;
    for (const kw of trend.keywords) {
      if (q.includes(kw)) score += 2;
    }
    for (const word of q.split(/\s+/)) {
      if (word.length > 3 && trend.text.toLowerCase().includes(word)) score += 1;
    }
    return { trend, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length >= limit) return scored.slice(0, limit).map((x) => x.trend);
  if (scored.length > 0) {
    const picked = scored.map((x) => x.trend);
    for (const trend of CURATED_TRENDS) {
      if (picked.length >= limit) break;
      if (!picked.includes(trend)) picked.push(trend);
    }
    return picked.slice(0, limit);
  }

  return CURATED_TRENDS.slice(0, limit);
}

interface TrendResult {
  title: string;
  text: string;
  imageUrl: string;
  source: string;
}

export async function searchDesignTrends(query: string): Promise<TrendResult[]> {
  const portfolioFirst = matchPortfolio(query, 2).map((p) => ({
    title: p.title,
    text: p.text,
    imageUrl: p.imageUrl,
    source: p.source,
  }));

  const apiKey = process.env.TAVILY_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query: `${query} kitchen bathroom interior design trends 2026 site:houzz.com OR site:architecturaldigest.com OR site:allinremodeling.us`,
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
            imageUrl: r.images?.[0] || matchPortfolio(query, 1)[0]?.imageUrl || ALLIN_PORTFOLIO[0].imageUrl,
            source: new URL(r.url).hostname.replace('www.', ''),
          }),
        );
        if (webResults.length > 0) {
          return [...portfolioFirst, ...webResults].slice(0, 5);
        }
      }
    } catch {
      // fall through
    }
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
