import { BRAND, BRAND_ASSETS, BRAND_COLORS, ECOSYSTEM } from '../lib/brand'

export function BrandMark({ size = 'md', variant = 'dark' }: { size?: 'sm' | 'md' | 'lg'; variant?: 'dark' | 'light' }) {
  const heights = { sm: 'h-7', md: 'h-9', lg: 'h-14' }
  const src = variant === 'light' ? BRAND_ASSETS.logoBuildersLight : BRAND_ASSETS.logoBuildersDark

  return (
    <img
      src={src}
      alt={ECOSYSTEM.builders.name}
      className={`${heights[size]} w-auto object-contain`}
    />
  )
}

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex items-center gap-3' : 'flex flex-col items-center text-center'}>
      <BrandMark size={compact ? 'sm' : 'md'} />
      {!compact && (
        <div className="mt-3 space-y-1">
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: BRAND_COLORS.muted }}>
            {ECOSYSTEM.builders.name}
          </p>
          <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight">
            {BRAND.productFullName}
          </h1>
          <p className="text-xs tracking-[0.15em] uppercase" style={{ color: BRAND_COLORS.accent }}>
            {BRAND.tagline}
          </p>
          <p className="text-sm mt-2" style={{ color: BRAND_COLORS.muted }}>
            {BRAND.subtitle}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <img src={BRAND_ASSETS.logoSmartSlab} alt="SmartSlab" className="h-4 object-contain opacity-80" />
            <span className="text-[10px] text-[#999]">marketplace integrado</span>
          </div>
        </div>
      )}
      {compact && (
        <div>
          <span className="font-bold text-sm text-[#0a0a0a] block">{BRAND.productName}</span>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: BRAND_COLORS.accent }}>
            {BRAND.tagline}
          </span>
        </div>
      )}
    </div>
  )
}
