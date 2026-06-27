export const ECOSYSTEM = {
  remodeling: {
    name: 'All In Remodeling',
    url: 'https://allinremodeling.us',
    portfolio: 'https://allinremodeling.us/portfolio/',
    shop: 'https://allinremodeling.us/shop/',
    estimate: 'https://allinremodeling.us/contact/',
    virtualAppt: 'https://allinremodeling.us/',
    showroom: 'https://allinremodeling.us/contact/',
    services: ['Cabinets', 'Countertops', 'Quartz', 'Granite', 'Vanities', 'Waterfall Islands', 'Outdoor Kitchen'],
  },
  builders: {
    name: 'All In Builders',
    url: 'https://www.allinbuilders.us/en',
    contact: 'https://www.allinbuilders.us/en/contact-us',
    services: ['Wood Framing', 'Countertops', 'Cabinets', 'Tile & Flooring', 'Painting', 'Sheetrock', 'Remodeling'],
  },
  smartslab: {
    name: 'SmartSlab',
    url: 'https://smartslab.app',
    app: 'https://smart-slab-app.vercel.app',
    browse: 'https://smart-slab-app.vercel.app/browse',
    tagline: 'Slab & remnant marketplace',
    materials: ['Granite', 'Quartz', 'Quartzite', 'Marble', 'Dolomite'],
  },
} as const

export const BRAND = {
  productName: 'AI-DA',
  productFullName: 'AI-DA · Artificial Intelligence Design Assistant',
  name: 'AI-DA',
  shortName: 'AI-DA',
  parent: 'ALL IN Builders LLC',
  partner: 'All In Remodeling',
  tagline: 'Cabinets · Countertops · Stone · Georgia',
  subtitle: 'Powered by All In Remodeling & SmartSlab',
  phone: '(470) 733-0461',
  phoneAlt: '(678) 725-6233',
  phoneRaw: '4707330461',
  email: 'allinremodelingcompany@gmail.com',
  website: ECOSYSTEM.remodeling.url,
  portfolio: ECOSYSTEM.remodeling.portfolio,
  estimate: ECOSYSTEM.remodeling.estimate,
  showroom: ECOSYSTEM.remodeling.showroom,
} as const

const BASE = import.meta.env.BASE_URL

/** Public assets under /public — respects Vite base (/ai/ on cPanel). */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\//, '')
  return `${BASE}${clean}`
}

export const BRAND_ASSETS = {
  /** Orange isotype — readable on light UI */
  logoIso: assetUrl('brand/iso.png'),
  /** Full wordmarks — use on dark surfaces or inside dark containers */
  logoAllIn: assetUrl('brand/allin.png'),
  logoBuildersDark: assetUrl('brand/all-in-builders-black.png'),
  logoBuildersLight: assetUrl('brand/all-in-builders-white.png'),
  logoSmartSlab: assetUrl('brand/smartslab.png'),
} as const

export const BRAND_COLORS = {
  primary: '#0a0a0a',
  primaryHover: '#1f1f1f',
  accent: '#e85d04',
  accentHover: '#c44d03',
  buildersOrange: '#e85d04',
  smartslabCyan: '#00bcd4',
  muted: '#6b6b6b',
  border: '#e5e5e5',
  surface: '#f9f9f9',
  darkSurface: '#0a0a0a',
} as const

export const ADVISOR_CTA = {
  scheduleVirtual:
    'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0DHYhK1FND-tidJmYEvRhhN2n8YQsXy1kZc4mUmezPzDv-Wz2fs-7aG59I-3jdOMwAczRIBMLI',
  freeEstimate: ECOSYSTEM.remodeling.estimate,
  callPhone: `tel:${BRAND.phoneRaw}`,
  whatsApp: `https://wa.me/1${BRAND.phoneRaw}`,
  whatsAppQuote: `https://wa.me/1${BRAND.phoneRaw}?text=${encodeURIComponent('Hola All In, quiero una cotización gratis para mi proyecto de remodelación.')}`,
  smartslabBrowse: ECOSYSTEM.smartslab.browse,
  buildersContact: ECOSYSTEM.builders.contact,
} as const
