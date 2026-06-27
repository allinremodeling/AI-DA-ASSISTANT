/** Express mode consultation counter — persists across page reloads. */
export const EXPRESS_COUNT_KEY = 'aida_express_count';

export function getExpressCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(EXPRESS_COUNT_KEY);
    const n = parseInt(raw ?? '0', 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setExpressCount(count: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXPRESS_COUNT_KEY, String(Math.max(0, count)));
  } catch {
    // ignore quota errors
  }
}

export function incrementExpressCount(): number {
  const next = getExpressCount() + 1;
  setExpressCount(next);
  return next;
}

export function resetExpressCount(): void {
  setExpressCount(0);
}
