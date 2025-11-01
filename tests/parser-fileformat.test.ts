import { describe, it, expect } from 'vitest';
import * as fileformat from '../scraper/sources/fileformat.mjs';

const html = `
<!doctype html><html><head>
  <link rel="canonical" href="https://docs.fileformat.com/video/mp4/" />
  <meta property="og:url" content="https://docs.fileformat.com/video/mp4/" />
</head><body>
  <article>
    <h2>MP4</h2>
    <p>MP4 is a container format for video and audio.</p>
    <h2>Technical Specification</h2>
    <p>Container based on ISO BMFF.</p>
    <p>Common MIME types include video/mp4 and audio/aac</p>
    <h3>How to Open</h3>
    <p>Use VLC or QuickTime.</p>
    <a href="/video/mov/">MOV</a>
    <figure><img src="/images/mp4.png" alt="MP4 icon"><figcaption>Icon</figcaption></figure>
  </article>
</body></html>`;

describe('parser: fileformat', () => {
  it('detects and parses docs.fileformat.com pages', () => {
    expect(fileformat.detect(html)).toBe(true);
    const rec = fileformat.parse(html)!;
    expect(rec.extension).toBe('mp4');
    expect(rec.slug).toBe('mp4');
    expect(rec.name.toLowerCase()).not.toMatch(/^what\s+is/);
    expect(rec.summary?.toLowerCase()).toContain('container format');
    expect(rec.technical_info?.content.join(' ').toLowerCase()).toContain('iso bmff');
    // MIME extraction
    expect((rec.mime || []).includes('video/mp4')).toBe(true);
    // Related extraction
    expect((rec.related || []).includes('mov')).toBe(true);
    // Images resolved to absolute
    expect(rec.images?.[0].url).toMatch(/^https?:\/\/docs\.fileformat\.com\//);
  });
});

