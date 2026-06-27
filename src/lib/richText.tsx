import type { ReactNode } from 'react';

/** Renders **bold** segments from GPT analysis text. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const safe = typeof text === 'string' ? text : String(text ?? '');
  const parts = safe.split(/(\*\*[^*]+\*\*)/g);

  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={i} className="font-semibold text-[#111111]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export function RichInline({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function formatMoney(value: unknown): string {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatProductPrice(value: unknown): string {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(2);
}

export { formatMoney };
