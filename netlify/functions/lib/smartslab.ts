export interface SmartSlabRow {
  id: string
  name: string
  material: string
  type: string
  location: string
  sqft: number
  price: number
  image_url: string
  url: string
}

/** Public listings mirrored from smart-slab-app.vercel.app (fallback when DB/API unavailable) */
const FALLBACK_LISTINGS: SmartSlabRow[] = [
  {
    id: 'ss-1',
    name: 'Calacatta Hudson',
    material: 'Quartz',
    type: 'full_slab',
    location: 'Norcross, GA',
    sqft: 56.4,
    price: 1045,
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    url: 'https://smart-slab-app.vercel.app/',
  },
  {
    id: 'ss-2',
    name: 'Calacatta Irving',
    material: 'Quartz',
    type: 'full_slab',
    location: 'Norcross, GA',
    sqft: 56.4,
    price: 935,
    image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/Calacatta-alpharetta.jpeg',
    url: 'https://smart-slab-app.vercel.app/',
  },
  {
    id: 'ss-3',
    name: 'Calacatta Amalfi',
    material: 'Quartz',
    type: 'remnant',
    location: 'Suwanee, GA',
    sqft: 0.1,
    price: 2,
    image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg',
    url: 'https://smart-slab-app.vercel.app/',
  },
  {
    id: 'ss-4',
    name: 'Calacatta Athens',
    material: 'Quartz',
    type: 'remnant',
    location: 'Suwanee, GA',
    sqft: 0.1,
    price: 2,
    image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkitta2.jpeg',
    url: 'https://smart-slab-app.vercel.app/',
  },
]

const SMARTSLAB_SUPABASE_URL = process.env.SMARTSLAB_SUPABASE_URL
const SMARTSLAB_SUPABASE_KEY =
  process.env.SMARTSLAB_SUPABASE_SECRET_KEY ||
  process.env.SMARTSLAB_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SMARTSLAB_SUPABASE_ANON_KEY

const SMARTSLAB_API_URL = process.env.SMARTSLAB_API_URL || 'https://smart-slab-app.vercel.app'

export async function searchSmartSlabListings(query: string, limit = 4): Promise<SmartSlabRow[]> {
  const q = query.toLowerCase()

  if (SMARTSLAB_SUPABASE_URL && SMARTSLAB_SUPABASE_KEY) {
    for (const table of ['listings', 'slabs', 'products']) {
      try {
        const url = new URL(`${SMARTSLAB_SUPABASE_URL}/rest/v1/${table}`)
        url.searchParams.set('select', '*')
        url.searchParams.set('limit', String(limit))
        const res = await fetch(url.toString(), {
          headers: {
            apikey: SMARTSLAB_SUPABASE_KEY,
            Authorization: `Bearer ${SMARTSLAB_SUPABASE_KEY}`,
          },
        })
        if (res.ok) {
          const rows = await res.json()
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map(normalizeRow)
          }
        }
      } catch {
        // try next table
      }
    }
  }

  try {
    const res = await fetch(`${SMARTSLAB_API_URL}/api/listings?limit=${limit}&q=${encodeURIComponent(query)}`)
    if (res.ok) {
      const data = await res.json()
      const rows = data.listings || data.data || data
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.slice(0, limit).map(normalizeRow)
      }
    }
  } catch {
    // fallback
  }

  const scored = FALLBACK_LISTINGS.map((item) => {
    let score = 0
    if (q.includes('cuarzo') || q.includes('quartz')) score += 2
    if (q.includes('calacatta')) score += 3
    if (q.includes('remnant') || q.includes('remanente')) score += item.type === 'remnant' ? 2 : 0
    if (item.name.toLowerCase().includes(q.slice(0, 6))) score += 1
    return { item, score }
  }).sort((a, b) => b.score - a.score)

  return scored.map((x) => x.item).slice(0, limit)
}

function normalizeRow(row: Record<string, unknown>): SmartSlabRow {
  return {
    id: String(row.id ?? row.slug ?? Math.random()),
    name: String(row.name ?? row.title ?? 'Slab listing'),
    material: String(row.material ?? row.stone_type ?? 'Quartz'),
    type: String(row.type ?? row.listing_type ?? 'full_slab'),
    location: String(row.location ?? row.city ?? 'Georgia'),
    sqft: Number(row.sqft ?? row.square_feet ?? 0),
    price: Number(row.price ?? 0),
    image_url: String(row.image_url ?? row.imageUrl ?? row.image ?? FALLBACK_LISTINGS[0].image_url),
    url: String(row.url ?? row.link ?? 'https://smart-slab-app.vercel.app/'),
  }
}

export function formatSmartSlabContext(listings: SmartSlabRow[]): string {
  return listings
    .map(
      (l, i) =>
        `${i + 1}. ${l.name} (${l.material}, ${l.type}) · ${l.location} · ${l.sqft} sqft · $${l.price} · ${l.image_url}`,
    )
    .join('\n')
}
