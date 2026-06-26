export interface ProjectDimensions {
  widthInches: number | null;
  depthInches: number | null;
  requiredSqft: number | null;
  rawMatches: string[];
}

function inchesToSqft(w: number, d: number): number {
  return Math.round((w * d) / 144 * 10) / 10;
}

/** Parse countertop/island dimensions from user message. */
export function parseProjectDimensions(message: string): ProjectDimensions {
  const rawMatches: string[] = [];
  let widthInches: number | null = null;
  let depthInches: number | null = null;
  let requiredSqft: number | null = null;

  const dimPair = message.match(
    /(\d+(?:\.\d+)?)\s*(?:x|×|por|\*|by)\s*(\d+(?:\.\d+)?)\s*(?:in|inch|inches|"|''|pulgadas?|pulg)?/i,
  );
  if (dimPair) {
    widthInches = parseFloat(dimPair[1]);
    depthInches = parseFloat(dimPair[2]);
    rawMatches.push(dimPair[0]);
    requiredSqft = inchesToSqft(widthInches, depthInches);
  }

  const sqftDirect = message.match(/(\d+(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|pies?\s*cuadrados?)/i);
  if (sqftDirect) {
    requiredSqft = parseFloat(sqftDirect[1]);
    rawMatches.push(sqftDirect[0]);
  }

  const feetPair = message.match(
    /(\d+(?:\.\d+)?)\s*(?:ft|feet|pie)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|pie)?/i,
  );
  if (feetPair && !widthInches) {
    widthInches = parseFloat(feetPair[1]) * 12;
    depthInches = parseFloat(feetPair[2]) * 12;
    rawMatches.push(feetPair[0]);
    requiredSqft = inchesToSqft(widthInches, depthInches);
  }

  if (!requiredSqft && /isla|island|counter|encimera|kitchen|cocina/i.test(message)) {
    requiredSqft = 35;
  }

  return { widthInches, depthInches, requiredSqft, rawMatches };
}

export function formatDimensionsForContext(dims: ProjectDimensions): string {
  if (!dims.requiredSqft && !dims.widthInches) return 'No specific dimensions detected.';
  const parts: string[] = [];
  if (dims.widthInches && dims.depthInches) {
    parts.push(`${dims.widthInches}" × ${dims.depthInches}"`);
  }
  if (dims.requiredSqft) parts.push(`~${dims.requiredSqft} sq ft estimated`);
  if (dims.rawMatches.length) parts.push(`detected: ${dims.rawMatches.join(', ')}`);
  return parts.join(' · ');
}
