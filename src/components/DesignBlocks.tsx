import type { ReactNode } from 'react';
import { Phone, Calendar, ExternalLink, Search } from 'lucide-react';
import type { DesignBlock, Product, SmartSlabListing } from '../lib/types';
import { BLOCK_SECTION_LABELS } from '../lib/types';
import { ADVISOR_CTA, BRAND, BRAND_COLORS, ECOSYSTEM } from '../lib/brand';
import { BrandMark, SmartSlabMark } from './BrandMark';

const BLOCK_ORDER = [
  'analysis', 'visual_analysis',
  'inspiration', 'external_inspiration', 'trend',
  'recommendation', 'ecosystem', 'product',
  'marketplace', 'smartslab',
  'action_plan',
];

function sortBlocks(blocks: DesignBlock[]): DesignBlock[] {
  return [...blocks].sort(
    (a, b) => BLOCK_ORDER.indexOf(a.type) - BLOCK_ORDER.indexOf(b.type),
  );
}

function getBlock(blocks: DesignBlock[], ...types: string[]) {
  return blocks.find((b) => types.includes(b.type));
}

function isInspiration(type: string) {
  return type === 'inspiration' || type === 'external_inspiration' || type === 'trend';
}

export function AssistantMessageBody({
  intro,
  blocks,
  followUp,
  products,
  smartslabListings,
  generatedImage,
}: {
  intro?: string;
  blocks?: DesignBlock[];
  followUp?: string;
  products?: Product[];
  smartslabListings?: SmartSlabListing[];
  generatedImage?: string;
}) {
  const sorted = blocks ? sortBlocks(blocks) : [];
  const actionPlan = sorted.find((b) => b.type === 'action_plan');
  const analysis = getBlock(sorted, 'analysis', 'visual_analysis');
  const inspiration = getBlock(sorted, 'inspiration', 'external_inspiration', 'trend');
  const recommendation = getBlock(sorted, 'recommendation', 'ecosystem', 'product');
  const marketplace = getBlock(sorted, 'marketplace', 'smartslab');
  const slab = smartslabListings?.[0];

  return (
    <div className="space-y-5 sm:space-y-7 min-w-0">
      <div className="hidden sm:flex items-center gap-2.5 pb-2 border-b border-[#e5e5e5]">
        <BrandMark size="sm" />
        <span className="text-[#ccc] text-xs">×</span>
        <SmartSlabMark size="md" />
      </div>

      {intro && (
        <div className="flex gap-2.5 items-start rounded-xl bg-[#fffaf5] border border-[#fdebd2] px-3 py-2.5 sm:px-4 sm:py-3">
          <Search className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BRAND_COLORS.accent }} />
          <p className="text-sm text-[#111111] leading-relaxed">{intro}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 lg:gap-7">
        {analysis && (
          <CardSection label={BLOCK_SECTION_LABELS.analysis} accent={BRAND_COLORS.accent}>
            <DesignBlockCard block={analysis} variant="analysis" />
          </CardSection>
        )}
        {inspiration && (
          <CardSection label={BLOCK_SECTION_LABELS.inspiration} accent={BRAND_COLORS.accent}>
            <DesignBlockCard block={inspiration} variant="inspiration" />
          </CardSection>
        )}
        {recommendation && (
          <CardSection label={BLOCK_SECTION_LABELS.recommendation} accent={BRAND_COLORS.accent}>
            <DesignBlockCard block={recommendation} variant="recommendation" />
          </CardSection>
        )}
        {marketplace && (
          <CardSection label={BLOCK_SECTION_LABELS.marketplace} accent={BRAND_COLORS.smartslabCyan}>
            <IntegratedMarketplaceCard block={marketplace} slab={slab} />
          </CardSection>
        )}
      </div>

      {actionPlan && (
        <div className="pt-2">
          <CardSection label={BLOCK_SECTION_LABELS.action_plan} accent={BRAND_COLORS.accent}>
            <ActionPlanCard block={actionPlan} />
          </CardSection>
        </div>
      )}

      {generatedImage && (
        <img src={generatedImage} alt="Render conceptual" className="rounded-xl max-h-80 w-full object-cover" />
      )}

      {products && products.length > 0 && !recommendation && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND_COLORS.accent }}>
            Catálogo All In Remodeling
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {followUp && (
        <p className="text-sm text-[#6b6b6b] italic border-t border-[#e5e5e5] pt-4">{followUp}</p>
      )}
    </div>
  );
}

function CardSection({
  label,
  accent,
  children,
}: {
  label?: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 min-w-0">
      {label && (
        <h3
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-snug px-0.5"
          style={{ color: accent }}
        >
          {label}
        </h3>
      )}
      {children}
    </div>
  );
}

function DesignBlockCard({
  block,
  variant,
}: {
  block: DesignBlock;
  variant: 'analysis' | 'inspiration' | 'recommendation' | 'marketplace' | 'default';
}) {
  const showImage =
    Boolean(block.imageUrl)
    && variant !== 'analysis'
    && variant !== 'marketplace';

  const isExternal = isInspiration(block.type);
  const imageOnTop = variant === 'inspiration' || variant === 'recommendation';

  return (
    <article
      className={`bg-white border rounded-xl overflow-hidden transition-shadow h-full flex flex-col min-w-0 ${
        variant === 'analysis'
          ? 'border-[#fdebd2] shadow-sm min-h-[100px]'
          : variant === 'inspiration'
            ? 'border-[#fdebd2] hover:shadow-md'
            : 'border-[#e5e5e5] hover:shadow-md'
      }`}
    >
      {showImage && imageOnTop && (
        <div className="aspect-[4/3] bg-[#f9f9f9] shrink-0 max-h-44 sm:max-h-48">
          <img
            src={block.imageUrl}
            alt={block.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3.5 sm:p-4 space-y-2 flex-1">
        <h4 className="text-sm font-semibold text-[#111111] leading-snug">{block.title}</h4>
        <p className="text-xs sm:text-[13px] text-[#6b6b6b] leading-relaxed">{block.text}</p>
        {block.source && (
          <p className="text-[10px] text-[#999999] truncate">
            {isExternal ? `Referencia: ${block.source}` : `Fuente: ${block.source}`}
          </p>
        )}
        {block.tags && block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {block.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#6b6b6b]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {showImage && !imageOnTop && (
        <div className="aspect-[4/3] bg-[#f9f9f9] shrink-0 max-h-44 sm:max-h-none">
          <img src={block.imageUrl} alt={block.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
    </article>
  );
}

function IntegratedMarketplaceCard({
  block,
  slab,
}: {
  block: DesignBlock;
  slab?: SmartSlabListing;
}) {
  const imageUrl = slab?.image_url;

  return (
    <article className="bg-white border border-[#cceef5] rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col min-w-0">
      {imageUrl ? (
        <a href={slab!.url} target="_blank" rel="noopener noreferrer" className="block shrink-0">
          <div className="aspect-[16/10] bg-[#f0fafb] max-h-44 sm:max-h-48 relative">
            <img
              src={imageUrl}
              alt={slab!.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/800x500/e8f6f8/00bcd4?text=SmartSlab';
              }}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
              <SmartSlabMark size="sm" />
              <span className="text-[10px] uppercase tracking-wide text-white font-medium">
                {slab!.material} · Full slab
              </span>
            </div>
          </div>
        </a>
      ) : (
        <div className="aspect-[16/10] max-h-32 bg-[#f0fafb] flex items-center justify-center border-b border-[#d0eef5]">
          <SmartSlabMark size="md" />
        </div>
      )}

      <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col">
        <h4 className="text-sm font-semibold text-[#111111] leading-snug">{block.title}</h4>
        <p className="text-xs sm:text-[13px] text-[#6b6b6b] leading-relaxed flex-1">{block.text}</p>

        {slab && (
          <div className="pt-2.5 mt-auto border-t border-[#e8f6f8] flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111111] truncate">{slab.name}</p>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                {slab.location}
                {slab.sqft > 1 && ` · ${slab.sqft} sq ft`}
              </p>
            </div>
            <p className="text-base font-bold shrink-0" style={{ color: BRAND_COLORS.smartslabCyan }}>
              ${slab.price.toLocaleString()}
            </p>
          </div>
        )}

        <a
          href={slab?.url || ECOSYSTEM.smartslab.browse}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-xs font-semibold text-white mt-1"
          style={{ backgroundColor: BRAND_COLORS.smartslabCyan }}
        >
          {slab ? 'Ver listing en SmartSlab' : 'Explorar SmartSlab'}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}

function ActionPlanCard({ block }: { block: DesignBlock }) {
  const ctaHref =
    block.ctaType === 'call' ? ADVISOR_CTA.callPhone
    : block.ctaType === 'smartslab' ? ADVISOR_CTA.smartslabBrowse
    : block.ctaType === 'portfolio' ? BRAND.portfolio
    : ADVISOR_CTA.freeEstimate;

  return (
    <article
      className="rounded-xl overflow-hidden border-2 w-full"
      style={{ borderColor: BRAND_COLORS.accent, backgroundColor: '#fffaf5' }}
    >
      <div className="p-4 sm:p-5 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: BRAND_COLORS.accent }}>
            ALL IN
          </p>
          <h4 className="text-base sm:text-lg font-bold text-[#111111] mt-1">
            {block.title.includes('All In') ? block.title : 'Hablar con un asesor'}
          </h4>
        </div>
        <p className="text-xs sm:text-sm text-[#6b6b6b] leading-relaxed">{block.text}</p>
        {block.steps && (
          <ol className="space-y-2.5">
            {block.steps.map((s) => (
              <li key={s.step} className="flex gap-3 text-xs sm:text-sm">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-white text-[10px]"
                  style={{ backgroundColor: BRAND_COLORS.accent }}
                >
                  {s.step}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-[#111111]">{s.title}</p>
                  <p className="text-[#6b6b6b] mt-0.5 leading-relaxed">{s.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
          <a
            href={ADVISOR_CTA.freeEstimate}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-white w-full sm:w-auto"
            style={{ backgroundColor: BRAND_COLORS.accent }}
          >
            <Calendar className="w-3.5 h-3.5" />
            Cotización gratis
          </a>
          <a
            href={ADVISOR_CTA.callPhone}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium border border-[#e5e5e5] bg-white text-[#111111] w-full sm:w-auto"
          >
            <Phone className="w-3.5 h-3.5" />
            {BRAND.phone}
          </a>
          {block.ctaLabel && (
            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-white w-full sm:w-auto"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              {block.ctaLabel}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <p className="text-[10px] text-[#999] pt-1">
          {ECOSYSTEM.builders.name} · {ECOSYSTEM.remodeling.name} · {ECOSYSTEM.smartslab.name}
        </p>
      </div>
    </article>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:shadow-md transition-shadow min-w-0">
      <div className="aspect-square bg-[#f9f9f9] relative max-h-48 sm:max-h-none">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e5e5e5/999999?text=Producto';
          }}
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-[#111111] line-clamp-2">{product.name}</p>
        <p className="text-xs text-[#6b6b6b] mt-1">{product.sku}</p>
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-sm font-bold text-[#111111]">${product.price.toFixed(2)}</span>
          <a
            href={product.woo_url || `${ECOSYSTEM.remodeling.shop}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shrink-0"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            Ver <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
