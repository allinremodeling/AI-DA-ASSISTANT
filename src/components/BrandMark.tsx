import { BRAND, BRAND_COLORS } from '../lib/brand'

export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-16 h-16 rounded-2xl' : size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-12 h-12 rounded-2xl'
  const icon = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-xl'

  return (
    <div
      className={`${box} flex items-center justify-center font-serif font-bold text-white`}
      style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.accent} 100%)` }}
    >
      <span className={icon}>Ai</span>
    </div>
  )
}

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-col items-center text-center'}>
      <BrandMark size={compact ? 'sm' : 'md'} />
      <div className={compact ? '' : 'mt-4'}>
        <h1
          className={`font-serif font-semibold text-[#1a1a1a] ${compact ? 'text-sm' : 'text-2xl'}`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {BRAND.name}
        </h1>
        {!compact && (
          <>
            <p className="text-xs tracking-[0.2em] uppercase mt-1" style={{ color: BRAND_COLORS.accent }}>
              {BRAND.tagline}
            </p>
            <p className="text-sm mt-2" style={{ color: BRAND_COLORS.muted }}>
              {BRAND.subtitle}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
