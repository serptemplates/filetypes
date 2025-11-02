import { describe, it, expect } from 'vitest';
import { hrefFiletype, hrefMimeSubtype, hrefTool, hrefCategoryInternal, hrefMimeType, hrefMimeRoot } from '../lib/url';

describe('URL builders', () => {
  it('builds filetype hrefs without double slashes', () => {
    expect(hrefFiletype('mp4')).toBe('/filetypes/mp4');
    expect(hrefFiletype('.jpg')).toBe('/filetypes/.jpg');
  });

  it('encodes MIME subtype path segments', () => {
    expect(hrefMimeSubtype('application', 'ace+json')).toBe('/mimetypes/application/ace%2Bjson');
    expect(hrefMimeSubtype('video', 'mp4')).toBe('/mimetypes/video/mp4');
  });

  it('normalizes tools routes', () => {
    expect(hrefTool('mp4-to-mov')).toBe('/tools/mp4-to-mov');
    expect(hrefTool('/mp4-to-mov')).toBe('/tools/mp4-to-mov');
    expect(hrefTool('//mp4-to-mov')).toBe('/tools/mp4-to-mov');
  });

  it('builds category href from internal slug', () => {
    expect(hrefCategoryInternal('raster_image')).toBe('/categories/raster-image');
  });

  it('builds MIME type root and type hrefs', () => {
    expect(hrefMimeRoot()).toBe('/mimetypes/');
    expect(hrefMimeType('video')).toBe('/mimetypes/video');
  });
});
