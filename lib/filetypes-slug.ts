// Helpers to normalize file extension slugs for URLs and DB lookups

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function normalizeExtSlug(raw: string): string {
  const s0 = String(raw || '').trim();
  const s1 = s0.includes('%') ? safeDecode(s0) : s0;
  return s1.toLowerCase();
}

export function toHrefExtParam(raw: string): string {
  // urlcat will encode this param; we just need a normalized base
  return normalizeExtSlug(raw);
}

export function fromRouteParam(param: string): string {
  return normalizeExtSlug(param);
}
