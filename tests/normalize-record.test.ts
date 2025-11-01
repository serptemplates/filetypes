import { describe, it, expect } from 'vitest';
import { normalizeRecord } from '../scraper/scripts/lib/normalize-record.mjs';
import { FileTypeSchema } from '../schemas/filetype.runtime.js';

describe('normalizeRecord', () => {
  it('lowercases slug/extension and fills defaults', () => {
    const rec = normalizeRecord({ extension: 'MP4' } as any, FileTypeSchema);
    expect(rec.slug).toBe('mp4');
    expect(rec.extension).toBe('mp4');
    expect(rec.name).toContain('MP4');
  });

  it('dedupes arrays and validates against schema', () => {
    const rec = normalizeRecord({
      slug: 'jpg',
      extension: 'jpg',
      name: 'JPEG',
      mime: ['image/jpeg', 'image/jpeg'],
      related: ['jpeg', 'jpeg'],
    }, FileTypeSchema);
    expect(rec.mime?.length).toBe(1);
    expect(rec.related?.length).toBe(1);
  });
});

