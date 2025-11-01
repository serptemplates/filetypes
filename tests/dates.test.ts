import { describe, it, expect } from 'vitest';
import { toIsoUtcZ, isIsoUtcZString, assertIsoUtcZ } from '../lib/dates';

describe('dates helpers', () => {
  it('formats to ISO UTC Z', () => {
    const s = toIsoUtcZ(new Date('2025-01-01T00:00:00Z'));
    expect(s).toMatch(/^2025-01-01T00:00:00\.\d{3}Z$/);
  });
  it('validates ISO UTC Z strings', () => {
    expect(isIsoUtcZString('2025-11-01T18:24:49.378Z')).toBe(true);
    expect(isIsoUtcZString('2025-11-01T18:24:49Z')).toBe(true);
    expect(isIsoUtcZString('2025-11-01 18:24:49Z')).toBe(false);
  });
  it('asserts invalid dates', () => {
    expect(() => assertIsoUtcZ('not-a-date')).toThrow();
  });
});

