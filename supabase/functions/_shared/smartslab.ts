export interface SmartSlabRow {
  id: string;
  name: string;
  material: string;
  type: string;
  location: string;
  sqft: number;
  price: number;
  image_url: string;
  url: string;
}

/** Synced from smart-slab-app.vercel.app homepage listings (fallback). */
const FALLBACK: SmartSlabRow[] = [
  {
    id: 'ss-hudson',
    name: 'Calacatta Hudson',
    material: 'Quartz',
    type: 'full_slab',
    location: 'Norcross, GA',
    sqft: 56.4,
    price: 1045,
    image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/Calacatta-alpharetta.jpeg',
    url: 'https://smart-slab-app.vercel.app/',
  },
  {
    id: 'ss-irving',
    name: 'Calacatta Irving',
    material: 'Quartz',
    type: 'full_slab',
    location: 'Norcross, GA',
    sqft: 56.4,
    price: 935,
    image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg',
    url: 'https://smart-slab-app.vercel.app/',
  },
  {
    id: 'ss-plano',
    name: 'Calacatta Plano',
    material: 'Quartz',
    type: 'full_slab',
    location: 'Norcross, GA',
    sqft: 56.4,
    price: 935,
    image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg',
    url: 'https://smart-slab-app.vercel.app/',
  },
  {
    id: 'ss-amalfi',
    name: 'Calacatta Amalfi',
    material: 'Quartz',
    type: 'remnant',
    location: 'Suwanee, GA',
    sqft: 0.1,
    price: 2,
    image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkitta2.jpeg',
    url: 'https://smart-slab-app.vercel.app/',
  },
  {
    id: 'ss-savoy',
    name: 'Calacatta Savoy Gold',
    material: 'Quartz',
    type: 'remnant',
    location: 'Suwanee, GA',
    sqft: 0.1,
    price: 2,
    image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkitta2.jpeg',
    url: 'https://smart-slab-app.vercel.app/',
  },
  {
    id: 'ss-athens',
    name: 'Calacatta Athens',
    material: 'Quartz',
    type: 'remnant',
    location: 'Suwanee, GA',
    sqft: 0.1,
    price: 2,
    image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkitta2.jpeg',
    url: 'https://smart-slab-app.vercel.app/',
  },
];

function normalizeRow(row: Record<string, unknown>): SmartSlabRow {
  return {
    id: String(row.id ?? row.slug ?? crypto.randomUUID()),
    name: String(row.name ?? row.title ?? 'Slab listing'),
    material: String(row.material ?? row.stone_type ?? 'Quartz'),
    type: String(row.type ?? row.listing_type ?? 'full_slab'),
    location: String(row.location ?? row.city ?? 'Georgia'),
    sqft: Number(row.sqft ?? row.square_feet ?? 0),
    price: Number(row.price ?? 0),
    image_url: String(row.image_url ?? row.imageUrl ?? row.image ?? FALLBACK[0].image_url),
    url: String(row.url ?? row.link ?? 'https://smart-slab-app.vercel.app/'),
  };
}

function scoreListing(row: SmartSlabRow, query: string, requiredSqft: number | null): number {
  const q = query.toLowerCase();
  let score = 0;

  if (/quartz|cuarzo|calacatta/i.test(q) && /quartz/i.test(row.material)) score += 3;
  if (/granite|granito/i.test(q) && /granite/i.test(row.material)) score += 3;
  if (/marble|marmol/i.test(q) && /marble/i.test(row.material)) score += 3;
  if (row.name.toLowerCase().split(/\s+/).some((w) => q.includes(w) && w.length > 3)) score += 2;

  if (requiredSqft != null) {
    if (requiredSqft <= 15 && row.type === 'remnant') score += 4;
    else if (requiredSqft > 15 && row.type === 'full_slab' && row.sqft >= requiredSqft) score += 5;
    else if (row.sqft >= requiredSqft) score += 3;
    else if (row.sqft >= requiredSqft * 0.7) score += 1;
  }

  return score;
}

function filterAndRankListings(
  rows: SmartSlabRow[],
  query: string,
  requiredSqft: number | null,
  limit: number,
): SmartSlabRow[] {
  return [...rows]
    .map((row) => ({ row, score: scoreListing(row, query, requiredSqft) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.row);
}

async function fetchFromSupabase(limit: number): Promise<SmartSlabRow[]> {
  const ssUrl = Deno.env.get('SMARTSLAB_SUPABASE_URL');
  const ssKey =
    Deno.env.get('SMARTSLAB_SUPABASE_SECRET_KEY')
    || Deno.env.get('SMARTSLAB_SUPABASE_SERVICE_ROLE_KEY')
    || Deno.env.get('SMARTSLAB_SUPABASE_ANON_KEY');

  if (!ssUrl || !ssKey) return [];

  for (const table of ['listings', 'slabs', 'products']) {
    try {
      const url = new URL(`${ssUrl}/rest/v1/${table}`);
      url.searchParams.set('select', '*');
      url.searchParams.set('limit', String(Math.max(limit, 12)));
      const res = await fetch(url.toString(), {
        headers: { apikey: ssKey, Authorization: `Bearer ${ssKey}` },
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) return rows.map(normalizeRow);
      }
    } catch { /* next table */ }
  }
  return [];
}

async function fetchFromApi(limit: number, query: string): Promise<SmartSlabRow[]> {
  const apiUrl = Deno.env.get('SMARTSLAB_API_URL') || 'https://smart-slab-app.vercel.app';
  try {
    const res = await fetch(`${apiUrl}/api/listings?limit=${limit}&q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      const rows = data.listings || data.data || data;
      if (Array.isArray(rows) && rows.length > 0) return rows.map(normalizeRow);
    }
  } catch { /* fallback */ }
  return [];
}

export async function searchSmartSlabListings(
  query: string,
  limit = 4,
  requiredSqft: number | null = null,
): Promise<SmartSlabRow[]> {
  const fromDb = await fetchFromSupabase(limit * 2);
  if (fromDb.length > 0) {
    return filterAndRankListings(fromDb, query, requiredSqft, limit);
  }

  const fromApi = await fetchFromApi(limit * 2, query);
  if (fromApi.length > 0) {
    return filterAndRankListings(fromApi, query, requiredSqft, limit);
  }

  return filterAndRankListings(FALLBACK, query, requiredSqft, limit);
}
