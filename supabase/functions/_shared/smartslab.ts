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

const BROWSE_URL = 'https://smart-slab-app.vercel.app/browse';

/** Full slabs synced from smart-slab-app.vercel.app/browse (fallback). */
const FALLBACK_FULL_SLABS: SmartSlabRow[] = [
  { id: 'ss-hudson', name: 'Calacatta Hudson', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 1045, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/Calacatta-alpharetta.jpeg', url: BROWSE_URL },
  { id: 'ss-irving', name: 'Calacatta Irving', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 935, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg', url: BROWSE_URL },
  { id: 'ss-plano', name: 'Calacatta Plano', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 935, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg', url: BROWSE_URL },
  { id: 'ss-buffalo', name: 'Calacatta Buffalo', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 935, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/Calacatta-alpharetta.jpeg', url: BROWSE_URL },
  { id: 'ss-jamaica', name: 'Calacatta Jamaica', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 935, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg', url: BROWSE_URL },
  { id: 'ss-boston', name: 'Calacatta Boston', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 935, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/Calacatta-alpharetta.jpeg', url: BROWSE_URL },
  { id: 'ss-orlando', name: 'Calacatta Orlando', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 770, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg', url: BROWSE_URL },
  { id: 'ss-strong', name: 'Calacatta Strong', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 72.3, price: 1250, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/Calacatta-alpharetta.jpeg', url: BROWSE_URL },
  { id: 'ss-santa', name: 'Santa Cecilia', material: 'Granite', type: 'full_slab', location: 'Suwanee, GA', sqft: 56, price: 659, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkitta2.jpeg', url: BROWSE_URL },
];

function normalizeRow(row: Record<string, unknown>): SmartSlabRow {
  const type = String(row.type ?? row.listing_type ?? 'full_slab');
  return {
    id: String(row.id ?? row.slug ?? crypto.randomUUID()),
    name: String(row.name ?? row.title ?? 'Slab listing'),
    material: String(row.material ?? row.stone_type ?? 'Quartz'),
    type,
    location: String(row.location ?? row.city ?? 'Georgia'),
    sqft: Number(row.sqft ?? row.square_feet ?? 0),
    price: Number(row.price ?? 0),
    image_url: String(row.image_url ?? row.imageUrl ?? row.image ?? FALLBACK_FULL_SLABS[0].image_url),
    url: String(row.url ?? row.link ?? BROWSE_URL),
  };
}

function isFullSlab(row: SmartSlabRow): boolean {
  const t = row.type.toLowerCase().replace(/_/g, ' ');
  return t.includes('full') && !t.includes('remnant');
}

function scoreListing(row: SmartSlabRow, query: string, requiredSqft: number | null): number {
  const q = query.toLowerCase();
  let score = 0;

  if (/quartz|cuarzo|calacatta/i.test(q) && /quartz/i.test(row.material)) score += 3;
  if (/granite|granito/i.test(q) && /granite/i.test(row.material)) score += 3;
  if (/marble|marmol/i.test(q) && /marble/i.test(row.material)) score += 3;
  if (row.name.toLowerCase().split(/\s+/).some((w) => q.includes(w) && w.length > 3)) score += 2;

  if (requiredSqft != null && row.sqft >= requiredSqft) score += 4;
  else if (requiredSqft != null && row.sqft >= requiredSqft * 0.7) score += 2;

  return score;
}

function pickOneFullSlab(rows: SmartSlabRow[], query: string, requiredSqft: number | null): SmartSlabRow | null {
  const fullSlabs = rows.filter(isFullSlab);
  if (fullSlabs.length === 0) return null;

  const scored = fullSlabs.map((row) => ({ row, score: scoreListing(row, query, requiredSqft) }));
  const maxScore = Math.max(...scored.map((s) => s.score));
  const topTier = scored.filter((s) => s.score === maxScore).map((s) => s.row);

  const pool = topTier.length > 0 ? topTier : fullSlabs;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function fetchFromSupabase(): Promise<SmartSlabRow[]> {
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
      url.searchParams.set('limit', '24');
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

async function fetchFromApi(query: string): Promise<SmartSlabRow[]> {
  const apiUrl = Deno.env.get('SMARTSLAB_API_URL') || 'https://smart-slab-app.vercel.app';
  try {
    const res = await fetch(`${apiUrl}/api/listings?limit=24&q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      const rows = data.listings || data.data || data;
      if (Array.isArray(rows) && rows.length > 0) return rows.map(normalizeRow);
    }
  } catch { /* fallback */ }
  return [];
}

/** Returns 0 or 1 full slab — filtered by query/dimensions, random among top matches. */
export async function searchSmartSlabListings(
  query: string,
  _limit = 1,
  requiredSqft: number | null = null,
): Promise<SmartSlabRow[]> {
  const fromDb = await fetchFromSupabase();
  if (fromDb.length > 0) {
    const pick = pickOneFullSlab(fromDb, query, requiredSqft);
    return pick ? [pick] : [];
  }

  const fromApi = await fetchFromApi(query);
  if (fromApi.length > 0) {
    const pick = pickOneFullSlab(fromApi, query, requiredSqft);
    return pick ? [pick] : [];
  }

  const pick = pickOneFullSlab(FALLBACK_FULL_SLABS, query, requiredSqft);
  return pick ? [pick] : [];
}

export function noSlabAdvisorMessage(lang: string): string {
  const messages: Record<string, string> = {
    es: 'No encontramos un full slab disponible que coincida en este momento. Un asesor All In puede guiarte personalmente — revisa el plan de acción abajo para contactarnos.',
    en: 'We could not find a matching full slab available right now. An All In advisor can guide you personally — see the action plan below to get in touch.',
    pt: 'Não encontramos um full slab disponível no momento. Um consultor All In pode orientá-lo — veja o plano de ação abaixo.',
    fr: 'Nous n\'avons pas trouvé de full slab correspondant pour le moment. Un conseiller All In peut vous guider — consultez le plan d\'action ci-dessous.',
  };
  return messages[lang] || messages.en;
}
