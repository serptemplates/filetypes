// Lightweight date helpers to keep formatting and validation consistent

// Accepts Date | string | number and returns ISO 8601 UTC (with trailing Z) or null on failure
export function toIsoUtcZ(input?: Date | string | number | null): string | null {
  if (input == null) return null;
  try {
    const d = input instanceof Date ? input : new Date(input as any);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (_) {
    return null;
  }
}

// Validates strict-ish ISO 8601 UTC format with Z
export function isIsoUtcZString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  // YYYY-MM-DDTHH:mm:ss(.sss)?Z
  const isoRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  if (!isoRe.test(value)) return false;
  const ts = Date.parse(value);
  return !Number.isNaN(ts);
}

export function assertIsoUtcZ(value: unknown, fieldName = 'date'): void {
  if (!isIsoUtcZString(value)) {
    throw new Error(`Invalid ${fieldName}: expected ISO8601 UTC (…Z), got ${String(value)}`);
  }
}

