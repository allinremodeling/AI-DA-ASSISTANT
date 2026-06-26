export const ECOSYSTEM_SERVICES = [
  {
    brand: 'All In Remodeling',
    url: 'https://allinremodeling.us',
    items: [
      { name: 'Shaker Cabinets', keywords: ['gabinete', 'cabinet', 'shaker'] },
      { name: 'Calacatta Quartz Countertops', keywords: ['cuarzo', 'quartz', 'calacatta', 'encimera'] },
      { name: 'Exotic Granite', keywords: ['granito', 'granite', 'exotic'] },
      { name: 'Kitchen Island & Waterfall', keywords: ['isla', 'island', 'waterfall'] },
      { name: 'Bathroom Vanities', keywords: ['bano', 'bath', 'vanity', 'vanidad'] },
      { name: 'Virtual Consultation', keywords: ['cita', 'consulta', 'asesor'] },
    ],
  },
  {
    brand: 'All In Builders',
    url: 'https://www.allinbuilders.us/en',
    items: [
      { name: 'Wood Framing', keywords: ['framing', 'estructura'] },
      { name: 'Tile & Flooring', keywords: ['tile', 'piso', 'flooring'] },
      { name: 'Painting & Sheetrock', keywords: ['pintura', 'painting', 'sheetrock'] },
      { name: 'Full Remodeling', keywords: ['remodel', 'remodelacion'] },
    ],
  },
] as const;

export function matchEcosystemServices(query: string, limit = 4) {
  const q = query.toLowerCase();
  const matches: { brand: string; name: string; url: string }[] = [];

  for (const group of ECOSYSTEM_SERVICES) {
    for (const item of group.items) {
      if (item.keywords.some((kw) => q.includes(kw))) {
        matches.push({ brand: group.brand, name: item.name, url: group.url });
      }
    }
  }

  if (matches.length >= limit) return matches.slice(0, limit);

  matches.push(
    { brand: 'All In Remodeling', name: 'Free Estimate', url: 'https://allinremodeling.us/contact/' },
    { brand: 'All In Builders', name: 'Construction & Remodeling', url: 'https://www.allinbuilders.us/en/contact-us' },
  );

  return matches.slice(0, limit);
}

export function buildActionPlanSteps(guest: boolean, lang = 'es') {
  if (lang === 'en') {
    return [
      { step: 1, title: 'Schedule a virtual consultation', description: 'An advisor reviews your measurements, style, and budget (15–30 min).' },
      { step: 2, title: 'Material selection', description: 'All In showroom + slabs at SmartSlab marketplace.' },
      { step: 3, title: 'Proposal & estimate', description: 'Layout, materials, and pricing — no commitment.' },
      {
        step: 4,
        title: guest ? 'Create your AI-DA account' : 'Project kickoff',
        description: guest
          ? 'Sign up to save your designs and continue with your advisor.'
          : 'All In Builders handles fabrication and installation.',
      },
    ];
  }

  return [
    { step: 1, title: 'Agenda consulta virtual', description: 'Un asesor revisa medidas, estilo y presupuesto (15–30 min).' },
    { step: 2, title: 'Selección de materiales', description: 'Showroom All In + slabs en SmartSlab marketplace.' },
    { step: 3, title: 'Propuesta y cotización', description: 'Layout, materiales y estimación sin compromiso.' },
    {
      step: 4,
      title: guest ? 'Crea cuenta AI-DA' : 'Inicio de proyecto',
      description: guest
        ? 'Regístrate para guardar diseños y continuar con tu asesor.'
        : 'All In Builders ejecuta fabricación e instalación.',
    },
  ];
}
