import { describe, it, expect } from 'vitest';
import * as fileorg from '../scraper/sources/fileorg.mjs';

const html = `
<!doctype html><html><head>
  <title>MP4 file - MPEG-4 Video</title>
</head><body>
  <h1>.mp4 file</h1>
  <h2>MPEG-4 Video</h2>
  <p>MP4 is a video format.</p>
  <table><tr><td class="w-100"><a href="https://example.com/vlc">VLC</a></td></tr></table>
  <figure><img src="/logo.png" alt="logo"></figure>
</body></html>`;

describe('parser: file.org', () => {
  it('parses basic details', () => {
    const rec = fileorg.parse(html)!;
    expect(rec.extension).toBe('mp4');
    expect(rec.name.toLowerCase()).toContain('mpeg-4');
    expect(rec.summary?.toLowerCase()).toContain('video');
    expect(rec.programs?.windows?.[0].name).toBe('VLC');
    expect(rec.images?.[0].url).toMatch(/^https?:\/\/file\.org\//);
  });
});

