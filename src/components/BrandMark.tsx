import { BRAND, BRAND_ASSETS, BRAND_COLORS, ECOSYSTEM } from '../lib/brand'

export function BrandMark({
  size = 'md',
  variant = 'dark',
}: {
  size?: 'sm' | 'md' | 'lg'
  /** dark = light UI (iso); light = dark surfaces (full white wordmark) */
  variant?: 'dark' | 'light'
}) {
  const isoSizes = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' }
  const wordmarkHeights = { sm: 'h-7', md: 'h-9', lg: 'h-12' }

  if (variant === 'dark') {
    return (
      <img
        src={BRAND_ASSETS.logoIso}
        alt={ECOSYSTEM.builders.name}
        className={`${isoSizes[size]} object-contain shrink-0 rounded-md`}
      />
    )
  }

  return (
    <img
      src={BRAND_ASSETS.logoBuildersLight}
      alt={ECOSYSTEM.builders.name}
      className={`${wordmarkHeights[size]} w-auto max-w-[180px] object-contain`}
    />
  )
}

export function AllInRemodelingMark({ showLabel = true }: { showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 shrink-0 min-w-0">
      <img
        src={BRAND_ASSETS.logoIso}
        alt={ECOSYSTEM.remodeling.name}
        className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-md shrink-0"
      />
      {showLabel && (
        <span className="hidden sm:flex flex-col leading-none min-w-0">
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#111111]">ALL IN</span>
          <span className="text-[9px] font-semibold tracking-[0.14em] text-[#666666] uppercase mt-0.5">
            Remodeling
          </span>
        </span>
      )}
    </span>
  )
}

export function SmartSlabMark({
  size = 'sm',
  onLightBg = true,
}: {
  size?: 'sm' | 'md'
  /** Wrap full logo in dark pill when the app background is white */
  onLightBg?: boolean
}) {
  const heights = { sm: 'h-5', md: 'h-6' }

  const logo = (
    <img
      src={BRAND_ASSETS.logoSmartSlab}
      alt={ECOSYSTEM.smartslab.name}
      className={`${heights[size]} w-auto max-w-[96px] object-contain`}
    />
  )

  if (!onLightBg) return logo

  return (
    <span className="inline-flex items-center rounded-md bg-[#0a0a0a] px-2 py-1 shrink-0">
      {logo}
    </span>
  )
}

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <BrandMark size="sm" variant="dark" />
        <div className="text-left">
          <span className="font-bold text-sm text-[#0a0a0a] block leading-tight">{BRAND.productName}</span>
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: BRAND_COLORS.accent }}>
            {BRAND.tagline}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center">
      <BrandMark size="lg" variant="dark" />

      <div className="mt-5 space-y-2 max-w-md">
        <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#8a8a8a]">
          {ECOSYSTEM.builders.name}
        </p>
        <h1 className="font-serif text-[1.65rem] sm:text-[1.85rem] font-semibold text-[#0a0a0a] leading-tight tracking-tight">
          {BRAND.productName}
          <span className="block text-base sm:text-lg font-sans font-normal text-[#444] mt-1">
            Artificial Intelligence Design Assistant
          </span>
        </h1>
        <p
          className="text-[11px] tracking-[0.14em] uppercase font-semibold pt-1"
          style={{ color: BRAND_COLORS.accent }}
        >
          {BRAND.tagline}
        </p>
        <p className="text-sm text-[#666] leading-relaxed pt-1">
          {BRAND.subtitle}
        </p>
      </div>

      <div className="mt-4 inline-flex items-center gap-2.5">
        <SmartSlabMark size="md" />
        <span className="text-[11px] font-medium text-[#666]">marketplace integrado</span>
      </div>
    </div>
  )
}
