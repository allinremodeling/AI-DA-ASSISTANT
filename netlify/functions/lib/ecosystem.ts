export const ECOSYSTEM_SERVICES = [
  {
    brand: 'All In Remodeling',
    url: 'https://allinremodeling.us',
    items: [
      { name: 'Shaker Cabinets', category: 'cabinets', keywords: ['gabinete', 'cabinet', 'shaker'] },
      { name: 'Calacatta Quartz Countertops', category: 'countertops', keywords: ['cuarzo', 'quartz', 'calacatta', 'encimera'] },
      { name: 'Exotic Granite', category: 'countertops', keywords: ['granito', 'granite', 'exotic'] },
      { name: 'Kitchen Island & Waterfall', category: 'remodeling', keywords: ['isla', 'island', 'waterfall'] },
      { name: 'Bathroom Vanities', category: 'bath', keywords: ['bano', 'bath', 'vanity', 'vanidad'] },
      { name: 'Virtual Consultation', category: 'service', keywords: ['cita', 'consulta', 'asesor'] },
    ],
  },
  {
    brand: 'All In Builders',
    url: 'https://www.allinbuilders.us/en',
    items: [
      { name: 'Wood Framing', category: 'construction', keywords: ['framing', 'estructura'] },
      { name: 'Tile & Flooring', category: 'flooring', keywords: ['tile', 'piso', 'flooring'] },
      { name: 'Painting & Sheetrock', category: 'finishing', keywords: ['pintura', 'painting', 'sheetrock'] },
      { name: 'Full Remodeling', category: 'remodeling', keywords: ['remodel', 'remodelacion'] },
    ],
  },
] as const

export function matchEcosystemServices(query: string, limit = 4) {
  const q = query.toLowerCase()
  const matches: { brand: string; name: string; url: string }[] = []

  for (const group of ECOSYSTEM_SERVICES) {
    for (const item of group.items) {
      const hit = item.keywords.some((kw) => q.includes(kw))
      if (hit) {
        matches.push({ brand: group.brand, name: item.name, url: group.url })
      }
    }
  }

  if (matches.length >= limit) return matches.slice(0, limit)

  matches.push(
    { brand: 'All In Remodeling', name: 'Free Estimate', url: 'https://allinremodeling.us/contact/' },
    { brand: 'All In Builders', name: 'Construction & Remodeling', url: 'https://www.allinbuilders.us/en/contact-us' },
  )

  return matches.slice(0, limit)
}

export function buildActionPlanSteps(guest: boolean): { step: number; title: string; description: string }[] {
  return [
    {
      step: 1,
      title: 'Agenda consulta virtual',
      description: 'Un asesor revisa contigo medidas, estilo y presupuesto objetivo (15–30 min).',
    },
    {
      step: 2,
      title: 'Selección de materiales',
      description: 'Visitas showroom o exploras slabs en SmartSlab + gabinetes y cuarzo All In Remodeling.',
    },
    {
      step: 3,
      title: 'Propuesta y cotización',
      description: 'Recibes layout, materiales específicos y estimación detallada sin compromiso.',
    },
    {
      step: 4,
      title: guest ? 'Crea cuenta AI-DA' : 'Inicio de proyecto',
      description: guest
        ? 'Regístrate para guardar diseños y continuar con tu asesor asignado.'
        : 'All In Builders ejecuta fabricación e instalación con seguimiento dedicado.',
    },
  ]
}
