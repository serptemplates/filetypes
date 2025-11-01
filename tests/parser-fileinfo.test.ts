import { describe, it, expect } from 'vitest';
import * as fileinfo from '../scraper/sources/fileinfo.mjs';

const html = `
<!doctype html><html><head>
  <title>MP4 File Extension</title>
  <link rel="canonical" href="https://fileinfo.com/extension/mp4" />
  <meta name="description" content="An MP4 file is a common container for video and audio." />
</head><body>
  <h1>.MP4 File Extension</h1>
  <section class="filetype">
    <h2 class="title">MPEG-4 Video</h2>
    <table class="headerInfo">
      <tr><td>Developer</td><td>Moving Picture Experts Group</td></tr>
    </table>
    <h3>What is an MP4 file?</h3>
    <p>Overview paragraph.</p>
    <h3>How to open</h3>
    <ul><li>Open with VLC</li></ul>
    <h3>How to convert</h3>
    <ul><li>Convert with HandBrake</li></ul>
    <h3>Common Filenames</h3>
    <ul><li>sample.mp4</li></ul>
  </section>
  <a href="/software/videolan/vlc/">VLC</a>
  <figure><img src="/images/shot.png" alt="shot"><figcaption>Shot</figcaption></figure>
</body></html>`;

describe('parser: fileinfo', () => {
  it('detects and parses fileinfo.com pages', () => {
    expect(fileinfo.detect(html)).toBe(true);
    const rec = fileinfo.parse(html)!;
    expect(rec.extension).toBe('mp4');
    expect(rec.type_name).toBe('MPEG-4 Video');
    expect(rec.developer).toMatch(/Moving Picture/);
    expect(rec.more_information?.description?.length).toBeGreaterThan(0);
    expect(rec.how_to_open?.instructions?.[0]).toMatch(/VLC/);
    expect(rec.how_to_convert?.instructions?.[0]).toMatch(/HandBrake/);
    expect(rec.common_filenames?.[0]).toBe('sample.mp4');
    expect(rec.programs?.windows?.[0].name).toBe('VLC');
    expect(rec.images?.[0].url).toMatch(/^https?:\/\/fileinfo\.com\//);
  });
});

