import { ExternalLink } from 'lucide-react';
import type { DesignBlock, Product } from '../lib/types';
import { BRAND, BRAND_COLORS } from '../lib/brand';

export function AssistantMessageBody({
  intro,
  blocks,
  followUp,
  products,
  generatedImage,
}: {
  intro?: string;
  blocks?: DesignBlock[];
  followUp?: string;
  products?: Product[];
  generatedImage?: string;
}) {
  return (
    <div className="space-y-4">
      {intro && (
        <p className="text-sm text-[#111111] leading-relaxed">{intro}</p>
      )}

      {blocks && blocks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {blocks.map((block, i) => (
            <DesignBlockCard key={`${block.title}-${i}`} block={block} />
          ))}
        </div>
      )}

      {generatedImage && (
        <img
          src={generatedImage}
          alt="Render conceptual"
          className="rounded-xl max-h-80 w-full object-cover"
        />
      )}

      {products && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {followUp && (
        <p className="text-sm text-[#6b6b6b] italic border-t border-[#e5e5e5] pt-3">{followUp}</p>
      )}
    </div>
  );
}

function DesignBlockCard({ block }: { block: DesignBlock }) {
  return (
    <article className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {block.imageUrl && (
        <div className="aspect-[4/3] bg-[#f9f9f9]">
          <img
            src={block.imageUrl}
            alt={block.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-[#111111]">{block.title}</h4>
          <span
            className="text-[10px] uppercase tracking-wide shrink-0 px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#faf8f3', color: BRAND_COLORS.accent }}
          >
            {block.type}
          </span>
        </div>
        <p className="text-xs text-[#6b6b6b] leading-relaxed">{block.text}</p>
        {block.source && (
          <p className="text-[10px] text-[#999999]">
            Fuente: {block.source.includes('allinremodeling') ? (
              <a href={BRAND.portfolio} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: BRAND_COLORS.accent }}>
                {block.source}
              </a>
            ) : block.source}
          </p>
        )}
        {block.tags && block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {block.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#6b6b6b]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
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
            (e.target as HTMLImageElement).src =
              'https://placehold.co/400x400/e5e5e5/999999?text=Producto';
          }}
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-[#111111] line-clamp-2">{product.name}</p>
        <p className="text-xs text-[#6b6b6b] mt-1">{product.sku}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-[#111111]">${product.price.toFixed(2)}</span>
          <a
            href={product.woo_url || `https://allinremodeling.us/product/${product.slug || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-[#111111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333333] transition-colors inline-flex items-center gap-1"
          >
            Ver <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
