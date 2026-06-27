const DESIGN_VOCAB = [
  'cocina', 'kitchen', 'baño', 'bathroom', 'cuarzo', 'quartz', 'granito', 'granite',
  'mármol', 'marble', 'calacatta', 'carrara', 'shaker', 'moderno', 'modern', 'minimal',
  'isla', 'island', 'waterfall', 'backsplash', 'encimera', 'countertop', 'gabinete',
  'cabinet', 'vanity', 'vanidad', 'spa', 'industrial', 'farmhouse', 'contemporáneo',
  'contemporary', 'blanco', 'white', 'negro', 'black', 'gris', 'gray', 'grey', 'veta',
  'vein', 'two-tone', 'navy', 'green', 'dorado', 'gold', 'porcelain', 'porcelanato',
];

/** Pull **bold** tokens and design vocabulary from user message + vision for image search. */
export function extractDesignKeywords(...sources: (string | undefined)[]): string[] {
  const limit = 8;
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (raw: string) => {
    const token = raw.trim().toLowerCase();
    if (token.length < 3 || seen.has(token)) return;
    seen.add(token);
    out.push(raw.trim());
  };

  for (const src of sources) {
    if (!src) continue;
    for (const m of src.matchAll(/\*\*([^*]+)\*\*/g)) add(m[1]);
    const lower = src.toLowerCase();
    for (const term of DESIGN_VOCAB) {
      if (lower.includes(term)) add(term);
    }
  }

  return out.slice(0, limit);
}

export function buildInspirationImageQuery(keywords: string[], lang = 'es'): string {
  const core = keywords.length > 0 ? keywords.join(' ') : 'modern kitchen interior';
  const roomHint = lang === 'en'
    ? 'kitchen bathroom interior design inspiration photos'
    : 'cocina baño diseño interiores inspiración fotos';
  return `${core} ${roomHint} houzz pinterest archdaily 2026`.slice(0, 420);
}
