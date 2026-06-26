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

const FALLBACK: SmartSlabRow[] = [
  {
    id: 'ss-1',
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
    id: 'ss-2',
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
    id: 'ss-3',
    name: 'Calacatta Amalfi',
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

export async function searchSmartSlabListings(query: string, limit = 4): Promise<SmartSlabRow[]> {
  const ssUrl = Deno.env.get('SMARTSLAB_SUPABASE_URL');
  const ssKey =
    Deno.env.get('SMARTSLAB_SUPABASE_SECRET_KEY')
    || Deno.env.get('SMARTSLAB_SUPABASE_SERVICE_ROLE_KEY')
    || Deno.env.get('SMARTSLAB_SUPABASE_ANON_KEY');

  if (ssUrl && ssKey) {
    for (const table of ['listings', 'slabs', 'products']) {
      try {
        const url = new URL(`${ssUrl}/rest/v1/${table}`);
        url.searchParams.set('select', '*');
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), {
          headers: { apikey: ssKey, Authorization: `Bearer ${ssKey}` },
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) return rows.map(normalizeRow);
        }
      } catch { /* next table */ }
    }
  }

  const apiUrl = Deno.env.get('SMARTSLAB_API_URL') || 'https://smart-slab-app.vercel.app';
  try {
    const res = await fetch(`${apiUrl}/api/listings?limit=${limit}&q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      const rows = data.listings || data.data || data;
      if (Array.isArray(rows) && rows.length > 0) return rows.slice(0, limit).map(normalizeRow);
    }
  } catch { /* fallback */ }

  return FALLBACK.slice(0, limit);
}
