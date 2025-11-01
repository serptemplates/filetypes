import { describe, it, expect } from 'vitest';
import { getFileCategory, toCategoryUrlSlug, fromCategoryUrlSlug, buildCategoryHref } from '../lib/files-categories';

describe('category helpers', () => {
  it('maps extensions to categories', () => {
    expect(getFileCategory('mp4')).toBe('video');
    expect(getFileCategory('.mp3')).toBe('audio');
    expect(getFileCategory('unknown')).toBe('misc');
    expect(getFileCategory(undefined as any)).toBe('misc');
  });

  it('uses hyphenated URLs for categories', () => {
    const urlSlug = toCategoryUrlSlug('raster_image');
    expect(urlSlug).toBe('raster-image');
    const internal = fromCategoryUrlSlug(urlSlug);
    expect(internal).toBe('raster_image');
    const href = buildCategoryHref('raster_image');
    expect(href).toBe('/categories/raster-image');
    expect(href.includes('_')).toBe(false);
  });
});

