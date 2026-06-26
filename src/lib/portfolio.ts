export interface PortfolioReference {
  title: string
  text: string
  imageUrl: string
  projectUrl: string
  location: string
  keywords: string[]
}

/** Real projects from allinremodeling.us portfolio */
export const ALLIN_PORTFOLIO: PortfolioReference[] = [
  {
    title: 'Full Kitchen Remodel',
    text: 'Remodelación integral con gabinetes premium, encimeras de piedra y distribución optimizada.',
    imageUrl: 'https://allinremodeling.us/wp-content/uploads/2025/12/IMG_0792-scaled.jpg',
    projectUrl: 'https://allinremodeling.us/portfolio/fully-remodeling/',
    location: 'Georgia',
    keywords: ['remodel', 'cocina', 'integral', 'georgia', 'kitchen'],
  },
  {
    title: 'Calacatta Quartz — Alpharetta',
    text: 'Isla y encimeras en cuarzo Calacatta con vetas dramáticas. Proyecto signature de All In.',
    imageUrl: 'https://allinremodeling.us/wp-content/uploads/2025/05/Calacatta-alpharetta.jpeg',
    projectUrl: 'https://allinremodeling.us/portfolio/calacatta-alpharetta/',
    location: 'Alpharetta, GA',
    keywords: ['calacatta', 'cuarzo', 'quartz', 'isla', 'blanco', 'veta'],
  },
  {
    title: 'Kitchen Calacatta Gold',
    text: 'Cocina con cuarzo Calacatta Gold, gabinetes claros y acabados de lujo.',
    imageUrl: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg',
    projectUrl: 'https://allinremodeling.us/portfolio/kitchen-calacatta-gold/',
    location: 'Georgia',
    keywords: ['gold', 'dorado', 'calacatta', 'shaker', 'moderno'],
  },
  {
    title: 'Golden Carrara Kitchen',
    text: 'Encimeras Golden Carrara con calidez mediterránea y gabinetes contemporáneos.',
    imageUrl: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkitta2.jpeg',
    projectUrl: 'https://allinremodeling.us/portfolio/golden-carrara/',
    location: 'Georgia',
    keywords: ['carrara', 'marmol', 'marble', 'carrara', 'calido'],
  },
  {
    title: 'Spa Bathroom Vanity',
    text: 'Vanidad de baño con piedra premium, estilo spa y grifería moderna.',
    imageUrl: 'https://allinremodeling.us/wp-content/uploads/2025/05/vanity-.jpeg',
    projectUrl: 'https://allinremodeling.us/portfolio/vanity/',
    location: 'Tennessee',
    keywords: ['bano', 'bath', 'vanity', 'vanidad', 'spa', 'baño'],
  },
]

export function matchPortfolio(query: string, limit = 3): PortfolioReference[] {
  const q = query.toLowerCase()
  const scored = ALLIN_PORTFOLIO.map((item) => {
    let score = 0
    for (const kw of item.keywords) {
      if (q.includes(kw)) score += 2
    }
    return { item, score }
  })
    .sort((a, b) => b.score - a.score)

  const withScore = scored.filter((x) => x.score > 0).map((x) => x.item)
  if (withScore.length >= limit) return withScore.slice(0, limit)

  const picked = [...withScore]
  for (const item of ALLIN_PORTFOLIO) {
    if (picked.length >= limit) break
    if (!picked.includes(item)) picked.push(item)
  }
  return picked.slice(0, limit)
}
