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

const APP_ORIGIN = 'https://smart-slab-app.vercel.app';
const BROWSE_URL = `${APP_ORIGIN}/browse`;
const API_PATHS = ['/api/listings', '/api/public/listings', '/api/v1/listings'];

/** Static fallback when browse feed is unreachable. */
const FALLBACK_FULL_SLABS: SmartSlabRow[] = [
  { id: 'ss-hudson', name: 'Calacatta Hudson', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 1045, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/Calacatta-alpharetta.jpeg', url: BROWSE_URL },
  { id: 'ss-irving', name: 'Calacatta Irving', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 935, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg', url: BROWSE_URL },
  { id: 'ss-plano', name: 'Calacatta Plano', material: 'Quartz', type: 'full_slab', location: 'Norcross, GA', sqft: 56.4, price: 935, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkita1.jpeg', url: BROWSE_URL },
  { id: 'ss-santa', name: 'Santa Cecilia', material: 'Granite', type: 'full_slab', location: 'Suwanee, GA', sqft: 56, price: 659, image_url: 'https://allinremodeling.us/wp-content/uploads/2025/05/nikkitta2.jpeg', url: BROWSE_URL },
];

/** SmartSlab browse stores slab size in inches (legacy field names widthCm/heightCm). */
function slabSqft(width: number, height: number): number {
  if (!width || !height) return 0;
  return Math.round((width * height) / 144 * 10) / 10;
}

/**
 * Parse live listings embedded in smart-slab-app.vercel.app/browse (Next.js RSC payload).
 * @see https://smart-slab-app.vercel.app/browse
 */
function parseBrowseFeedHtml(html: string): SmartSlabRow[] {
  const normalized = html.replace(/\\"/g, '"');
  const seen = new Set<string>();
  const rows: SmartSlabRow[] = [];

  const listingRe =
    /"id":"([a-f0-9-]{36})","vendorId":"[^"]*","locationId":[^,]*,"materialId":"[^"]*","type":"(full_slab|remnant)"[\s\S]*?"name":"([^"]+)"[\s\S]*?"widthCm":"([^"]+)"[\s\S]*?"heightCm":"([^"]+)"[\s\S]*?"city":"([^"]*?)"[\s\S]*?"state":"([^"]*?)"[\s\S]*?"price":"([^"]+)"[\s\S]*?"material":\{"id":"[^"]*","name":"([^"]+)"/g;

  for (const match of normalized.matchAll(listingRe)) {
    const [, id, type, name, width, height, city, state, price, material] = match;
    if (seen.has(id)) continue;
    seen.add(id);

    const chunk = normalized.slice(match.index ?? 0, (match.index ?? 0) + 2800);
    const imageMatch = chunk.match(/"images":\[\{"id":"[^"]*","slabId":"[^"]*","url":"(https:[^"]+)"/);

    rows.push({
      id,
      name,
      material,
      type,
      location: [city, state].filter(Boolean).join(', ') || 'Georgia',
      sqft: slabSqft(parseFloat(width), parseFloat(height)),
      price: Math.round(parseFloat(price)),
      image_url: imageMatch?.[1] || FALLBACK_FULL_SLABS[0].image_url,
      url: `${APP_ORIGIN}/slab/${id}`,
    });
  }

  return rows;
}

async function fetchFromBrowseFeed(): Promise<SmartSlabRow[]> {
  const feedUrl = Deno.env.get('SMARTSLAB_BROWSE_URL') || BROWSE_URL;
  try {
    const res = await fetch(feedUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'AI-DA/1.5 SmartSlab-Browse-Feed',
      },
    });
    if (!res.ok) {
      console.error('SmartSlab browse feed HTTP', res.status);
      return [];
    }
    const rows = parseBrowseFeedHtml(await res.text());
    console.log(`SmartSlab browse feed: ${rows.length} listings parsed`);
    return rows;
  } catch (err) {
    console.error('SmartSlab browse feed error', err);
    return [];
  }
}

function extractListingRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['listings', 'data', 'results', 'items', 'slabs']) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  return [];
}

function pickImage(row: Record<string, unknown>): string {
  const direct = row.image_url ?? row.imageUrl ?? row.image ?? row.thumbnail_url ?? row.thumbnailUrl;
  if (direct && String(direct).startsWith('http')) return String(direct);

  if (Array.isArray(row.images) && row.images[0]) {
    const img = row.images[0];
    if (typeof img === 'string') return img;
    if (img && typeof img === 'object') {
      const o = img as Record<string, unknown>;
      if (o.url && String(o.url).startsWith('http')) return String(o.url);
    }
  }

  return FALLBACK_FULL_SLABS[0].image_url;
}

function listingUrl(row: Record<string, unknown>): string {
  const direct = row.url ?? row.link ?? row.listing_url ?? row.listingUrl;
  if (direct && String(direct).startsWith('http')) return String(direct);

  const id = row.id;
  if (id && /^[a-f0-9-]{36}$/i.test(String(id))) {
    return `${APP_ORIGIN}/slab/${id}`;
  }

  return BROWSE_URL;
}

function normalizeRow(row: Record<string, unknown>): SmartSlabRow {
  const type = String(row.type ?? row.listing_type ?? row.listingType ?? 'full_slab');
  const locationParts = [row.location, row.city, row.state].filter(Boolean).map(String);
  const material = row.material;
  const materialName = typeof material === 'object' && material && 'name' in (material as object)
    ? String((material as Record<string, unknown>).name)
    : String(row.stone_type ?? row.stoneType ?? 'Quartz');

  return {
    id: String(row.id ?? row.slug ?? crypto.randomUUID()),
    name: String(row.name ?? row.title ?? 'Slab listing'),
    material: materialName,
    type,
    location: locationParts.length ? locationParts.join(', ') : 'Georgia',
    sqft: Number(row.sqft ?? row.square_feet ?? row.squareFeet ?? row.area_sqft ?? 0),
    price: Number(row.price ?? row.list_price ?? row.listPrice ?? 0),
    image_url: pickImage(row),
    url: listingUrl(row),
  };
}

function isFullSlab(row: SmartSlabRow): boolean {
  const t = row.type.toLowerCase().replace(/_/g, ' ');
  return t.includes('full') && !t.includes('remnant');
}

function scoreListing(row: SmartSlabRow, query: string, requiredSqft: number | null): number {
  const q = query.toLowerCase();
  let score = 0;

  if (/quartz|cuarzo|calacatta/i.test(q) && /quartz/i.test(row.material)) score += 4;
  if (/granite|granito/i.test(q) && /granite/i.test(row.material)) score += 4;
  if (/marble|marmol/i.test(q) && /marble/i.test(row.material)) score += 4;
  if (/quartzite/i.test(q) && /quartzite/i.test(row.material)) score += 4;
  if (/dolomite/i.test(q) && /dolomite/i.test(row.material)) score += 4;

  for (const word of row.name.toLowerCase().split(/\s+/)) {
    if (word.length > 3 && q.includes(word)) score += 2;
  }

  if (requiredSqft != null && row.sqft >= requiredSqft) score += 5;
  else if (requiredSqft != null && row.sqft >= requiredSqft * 0.75) score += 2;

  if (row.image_url.includes('vercel-storage.com')) score += 2;

  return score;
}

function pickOneFullSlab(rows: SmartSlabRow[], query: string, requiredSqft: number | null): SmartSlabRow | null {
  const fullSlabs = rows.filter(isFullSlab);
  if (fullSlabs.length === 0) return null;

  const scored = fullSlabs
    .map((row) => ({ row, score: scoreListing(row, query, requiredSqft) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (requiredSqft != null) {
        return Math.abs(a.row.sqft - requiredSqft) - Math.abs(b.row.sqft - requiredSqft);
      }
      return b.row.sqft - a.row.sqft;
    });

  return scored[0]?.row ?? null;
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
      url.searchParams.set('limit', '48');
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
  const apiUrl = (Deno.env.get('SMARTSLAB_API_URL') || APP_ORIGIN).replace(/\/$/, '');
  const apiKey = Deno.env.get('SMARTSLAB_API_KEY');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const params = new URLSearchParams({ limit: '48', q: query, type: 'full_slab' });

  for (const path of API_PATHS) {
    try {
      const res = await fetch(`${apiUrl}${path}?${params.toString()}`, { headers });
      if (!res.ok) continue;
      const data = await res.json();
      const rows = extractListingRows(data);
      if (rows.length > 0) return rows.map(normalizeRow);
    } catch { /* try next path */ }
  }

  return [];
}

/** Returns 0 or 1 full slab — browse feed first, then JSON API, Supabase, fallback. */
export async function searchSmartSlabListings(
  query: string,
  _limit = 1,
  requiredSqft: number | null = null,
): Promise<SmartSlabRow[]> {
  const sources = [
    await fetchFromBrowseFeed(),
    await fetchFromApi(query),
    await fetchFromSupabase(),
    FALLBACK_FULL_SLABS,
  ];

  for (const rows of sources) {
    if (rows.length === 0) continue;
    const pick = pickOneFullSlab(rows, query, requiredSqft);
    if (pick) return [pick];
  }

  return [];
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
