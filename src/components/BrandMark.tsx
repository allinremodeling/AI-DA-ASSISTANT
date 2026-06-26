import { BRAND, BRAND_ASSETS, BRAND_COLORS, ECOSYSTEM } from '../lib/brand'

export function BrandMark({
  size = 'md',
  variant = 'dark',
  framed = true,
}: {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
  framed?: boolean
}) {
  const heights = { sm: 'h-6', md: 'h-8', lg: 'h-10' }
  const src = variant === 'light' ? BRAND_ASSETS.logoBuildersLight : BRAND_ASSETS.logoBuildersDark

  const img = (
    <img
      src={src}
      alt={ECOSYSTEM.builders.name}
      className={`${heights[size]} w-auto max-w-[140px] object-contain object-left`}
    />
  )

  if (!framed) return img

  return (
    <div className="inline-flex items-center rounded-xl bg-[#0a0a0a] px-3 py-2 shadow-sm">
      {img}
    </div>
  )
}

export function SmartSlabMark({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const heights = { sm: 'h-5', md: 'h-6' }
  return (
    <div className="inline-flex items-center rounded-lg bg-[#050a14] px-2.5 py-1.5">
      <img
        src={BRAND_ASSETS.logoSmartSlab}
        alt={ECOSYSTEM.smartslab.name}
        className={`${heights[size]} w-auto max-w-[100px] object-contain`}
      />
    </div>
  )
}

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <BrandMark size="sm" framed={false} />
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
      <BrandMark size="lg" />

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

      <div className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-[#e8e8e8] bg-white px-3 py-2 shadow-sm">
        <SmartSlabMark />
        <span className="text-[11px] font-medium text-[#666]">marketplace integrado</span>
      </div>
    </div>
  )
}
