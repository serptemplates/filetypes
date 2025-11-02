import { describe, it, expect } from 'vitest';
import { hrefFiletype } from '../lib/url';
import { fromRouteParam, normalizeExtSlug } from '../lib/filetypes-slug';

describe('filetype slug + URL handling', () => {
  it('handles reserved characters safely (encoded where needed)', () => {
    const seg = (u: string) => decodeURIComponent(u.split('/').pop() || '');
    expect(seg(hrefFiletype('!bt'))).toBe('!bt');
    expect(seg(hrefFiletype('@@@'))).toBe('@@@');
    expect(seg(hrefFiletype('##'))).toBe('##');
    expect(seg(hrefFiletype('^'))).toBe('^');
  });

  it('handles dot-prefixed and multi-dot extensions', () => {
    expect(hrefFiletype('._doc')).toBe('/filetypes/._doc');
    expect(hrefFiletype('._sys.lfo')).toBe('/filetypes/._sys.lfo');
  });

  it('decodes percent-encoded inputs before building href', () => {
    expect(hrefFiletype('%23%23')).toBe('/filetypes/%23%23');
    expect(hrefFiletype('%5E%5E%5E')).toBe('/filetypes/%5E%5E%5E');
  });

  it('normalizes slugs from route params for DB lookups', () => {
    expect(fromRouteParam('%23%23')).toBe('##');
    expect(fromRouteParam('%21ut')).toBe('!ut');
    expect(fromRouteParam('._XLS')).toBe('._xls');
    expect(normalizeExtSlug('.%7bpb')).toBe('.{pb');
  });
});
