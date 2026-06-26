export interface TrendReference {
  title: string;
  text: string;
  imageUrl: string;
  source: string;
  keywords: string[];
}

export const CURATED_TRENDS: TrendReference[] = [
  {
    title: 'Warm Minimalism',
    text: 'Cocinas con paletas neutras cálidas, madera natural y líneas limpias. Los gabinetes shaker en tonos greige y encimeras de cuarzo con vetas sutiles dominan las remodelaciones premium de 2026.',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be4c00?w=800&q=80',
    source: 'Trend Report 2026',
    keywords: ['minimal', 'calido', 'warm', 'natural', 'shaker', 'neutro', 'moderno'],
  },
  {
    title: 'Two-Tone Cabinets',
    text: 'Combinar gabinetes superiores claros con bases en navy, verde bosque o negro mate crea profundidad visual sin sobrecargar espacios compactos.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    source: 'Houzz Trends',
    keywords: ['two-tone', 'bicolor', 'navy', 'contraste', 'isla', 'color'],
  },
  {
    title: 'Calacatta & Dramatic Veining',
    text: 'El cuarzo Calacatta con vetas grises dramáticas sigue siendo la elección #1 para islas y áreas focal. Pairs bien con hardware negro mate.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    source: 'NKBA Inspiration',
    keywords: ['cuarzo', 'quartz', 'calacatta', 'encimera', 'veta', 'granito', 'isla'],
  },
  {
    title: 'Integrated Lighting',
    text: 'LED bajo gabinetes, perfiles empotrados y iluminación en capas transforman cocinas oscuras. Esencial cuando hay gabinetes de madera oscura.',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    source: 'Lighting Design Weekly',
    keywords: ['luz', 'iluminacion', 'led', 'oscuro', 'dark', 'madera'],
  },
  {
    title: 'Spa-Inspired Bathrooms',
    text: 'Baños tipo spa con azulejo grande formato, nichos iluminados, grifería negro mate y vanidades flotantes. Tendencia fuerte en remodelaciones de lujo.',
    imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb576b9?w=800&q=80',
    source: 'Bath Trends 2026',
    keywords: ['bano', 'bath', 'spa', 'azulejo', 'vanidad', 'griferia'],
  },
  {
    title: 'Bold Hardware',
    text: 'Tiradores negro mate, dorado cepillado o latón envejecido actualizan cocinas tradicionales sin cambiar gabinetes completos.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    source: 'Design Milk',
    keywords: ['hardware', 'tirador', 'negro', 'mate', 'dorado', 'laton', 'actualizar'],
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

interface TavilyResult {
  title: string;
  text: string;
  imageUrl: string;
  source: string;
}

export async function searchDesignTrends(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query: `${query} kitchen bathroom interior design trends 2026`,
          search_depth: 'basic',
          include_images: true,
          max_results: 5,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).map((r: { title: string; content: string; url: string; images?: string[] }) => ({
          title: r.title,
          text: r.content?.slice(0, 400) || '',
          imageUrl: r.images?.[0] || CURATED_TRENDS[0].imageUrl,
          source: new URL(r.url).hostname.replace('www.', ''),
        }));
        if (results.length > 0) return results;
      }
    } catch {
      // fall through to curated
    }
  }

  return matchCuratedTrends(query).map((t) => ({
    title: t.title,
    text: t.text,
    imageUrl: t.imageUrl,
    source: t.source,
  }));
}
