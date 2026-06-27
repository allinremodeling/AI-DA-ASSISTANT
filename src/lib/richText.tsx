import type { ReactNode } from 'react';

/** Renders **bold** segments from GPT analysis text. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

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

/** Optional wrapper for mixed inline content. */
export function RichInline({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
