import { Phone, Calendar, ExternalLink } from 'lucide-react';
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

function isActionPlan(block: DesignBlock) {
  return block.type === 'action_plan';
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
  const actionPlan = sorted.find(isActionPlan);
  const contentBlocks = sorted.filter((b) => !isActionPlan(b));
  const slabsForMarketplace = smartslabListings?.length ? smartslabListings : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 pb-2 border-b border-[#e5e5e5]">
        <BrandMark size="sm" />
        <span className="text-[#ccc] text-xs">×</span>
        <SmartSlabMark size="md" />
      </div>

      {intro && (
        <p className="text-sm text-[#111111] leading-relaxed">{intro}</p>
      )}

      {contentBlocks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contentBlocks.map((block, i) => (
            <div key={`${block.type}-${block.title}-${i}`} className="space-y-2">
              {BLOCK_SECTION_LABELS[block.type] && (
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: (block.type === 'marketplace' || block.type === 'smartslab') ? BRAND_COLORS.smartslabCyan : BRAND_COLORS.accent }}
                >
                  {BLOCK_SECTION_LABELS[block.type]}
                </h3>
              )}
              <DesignBlockCard block={block} />
              {(block.type === 'marketplace' || block.type === 'smartslab') && slabsForMarketplace.length > 0 && (
                <div className="space-y-2 pt-1">
                  {slabsForMarketplace.map((slab) => (
                    <SmartSlabCard key={slab.id} slab={slab} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {actionPlan && (
        <div className="pt-1">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: BRAND_COLORS.accent }}
          >
            {BLOCK_SECTION_LABELS.action_plan}
          </h3>
          <ActionPlanCard block={actionPlan} />
        </div>
      )}

      {generatedImage && (
        <img src={generatedImage} alt="Render conceptual" className="rounded-xl max-h-80 w-full object-cover" />
      )}

      {products && products.length > 0 && !sorted.some((b) => b.type === 'recommendation' || b.type === 'ecosystem') && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND_COLORS.accent }}>
            Catálogo All In Remodeling
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {followUp && (
        <p className="text-sm text-[#6b6b6b] italic border-t border-[#e5e5e5] pt-3">{followUp}</p>
      )}
    </div>
  );
}

function DesignBlockCard({ block }: { block: DesignBlock }) {
  const isExternal = block.type === 'inspiration' || block.type === 'external_inspiration' || block.type === 'trend';
  const isAnalysis = block.type === 'analysis' || block.type === 'visual_analysis';

  return (
    <article className={`bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col ${isAnalysis ? 'min-h-[120px]' : ''}`}>
      {block.imageUrl && (
        <div className="aspect-[4/3] bg-[#f9f9f9] shrink-0">
          <img src={block.imageUrl} alt={block.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="p-3 space-y-2 flex-1">
        <h4 className="text-sm font-semibold text-[#111111]">{block.title}</h4>
        <p className="text-xs text-[#6b6b6b] leading-relaxed">{block.text}</p>
        {block.source && (
          <p className="text-[10px] text-[#999999]">
            {isExternal ? `Referencia: ${block.source}` : `Fuente: ${block.source}`}
          </p>
        )}
        {block.tags && block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {block.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#6b6b6b]">
                {tag}
              </span>
            ))}
          </div>
        )}
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
      className="rounded-xl overflow-hidden border-2"
      style={{ borderColor: BRAND_COLORS.accent, backgroundColor: '#fffaf5' }}
    >
      <div className="p-4 space-y-3">
        <h4 className="text-sm font-bold text-[#111111]">{block.title}</h4>
        <p className="text-xs text-[#6b6b6b]">{block.text}</p>
        {block.steps && (
          <ol className="space-y-2">
            {block.steps.map((s) => (
              <li key={s.step} className="flex gap-3 text-xs">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-white text-[10px]"
                  style={{ backgroundColor: BRAND_COLORS.accent }}
                >
                  {s.step}
                </span>
                <div>
                  <p className="font-semibold text-[#111111]">{s.title}</p>
                  <p className="text-[#6b6b6b] mt-0.5">{s.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <a
            href={ADVISOR_CTA.freeEstimate}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor: BRAND_COLORS.accent }}
          >
            <Calendar className="w-3.5 h-3.5" />
            Cotización gratis
          </a>
          <a
            href={ADVISOR_CTA.callPhone}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#e5e5e5] bg-white text-[#111111]"
          >
            <Phone className="w-3.5 h-3.5" />
            {BRAND.phone}
          </a>
          {block.ctaLabel && (
            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white"
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

function SmartSlabCard({ slab }: { slab: SmartSlabListing }) {
  return (
    <a
      href={slab.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="aspect-[4/3] bg-[#f0fafb]">
        <img src={slab.image_url} alt={slab.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <SmartSlabMark size="sm" />
          <span className="text-[10px] uppercase tracking-wide" style={{ color: BRAND_COLORS.smartslabCyan }}>
            {slab.material}
          </span>
        </div>
        <p className="text-sm font-medium text-[#111111]">{slab.name}</p>
        <p className="text-xs text-[#6b6b6b] mt-0.5">
          {slab.type === 'remnant' ? 'Remanente' : 'Slab completo'} · {slab.location}
        </p>
        <p className="text-sm font-bold mt-1" style={{ color: BRAND_COLORS.smartslabCyan }}>
          ${slab.price.toLocaleString()}
          {slab.sqft > 1 && <span className="text-xs font-normal text-[#999]"> · {slab.sqft} sq ft</span>}
        </p>
      </div>
    </a>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-[#f9f9f9] relative">
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
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-[#111111]">${product.price.toFixed(2)}</span>
          <a
            href={product.woo_url || `${ECOSYSTEM.remodeling.shop}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            Ver <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
