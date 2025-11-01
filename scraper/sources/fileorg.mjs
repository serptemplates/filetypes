// Source parser: file.org -> normalized partial record
import * as cheerio from 'cheerio';

const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

export function detect(html) {
  const $ = cheerio.load(html);
  const title = clean($('title').text()).toLowerCase();
  const hasBrand = title.includes('file') && $('a[href^="https://file.org"]').length >= 0;
  // Prefer absence of fileinfo/filext/fileformat markers
  const isOther = $('link[rel="canonical"]').attr('href')?.includes('fileinfo.com')
              || $('meta[name="generator"]').attr('content')?.toLowerCase().includes('fileformat')
              || $('title').text().toLowerCase().includes('filext')
  return !!hasBrand && !isOther;
}

export function parse(html) {
  const $ = cheerio.load(html);
  const h1 = clean($('h1').first().text());
  const title = clean($('title').text());
  const match = (h1 || title).match(/\.?([\w#&+-]+)\s+file/i);
  const ext = (match ? match[1] : '').toLowerCase();
  if (!ext) return null;

  const h2 = clean($('h2').first().text());
  const p1 = clean($('p').first().text());
  const name = h2 && !/programs|software/i.test(h2) ? h2 : (p1 ? p1.split('.')[0] : `${ext.toUpperCase()} File`);
  const summary = p1 || undefined;

  // Programs (basic)
  const programs = {};
  const all = [];
  $('table tr').each((_, row) => {
    const link = $(row).find('td.w-100 a').first().attr('href')
      ? $(row).find('td.w-100 a').first()
      : $(row).find('td a').first();
    if (link && link.length) {
      const n = clean(link.text());
      const url = link.attr('href');
      if (n && url && !n.match(/File Types|Software|Help Center|Random Extension|More Information|How to Open/i)) {
        all.push({ name: n, url: url.startsWith('http') ? url : `https://file.org${url}` });
      }
    }
  });
  if (all.length) programs['windows'] = all.slice(0, 12);

  // Images
  const base = 'https://file.org';
  const images = [];
  const seen = new Set();
  const resolve = (u) => { try { return new URL(u, base).href; } catch { return undefined; } };
  $('figure img, img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const abs = resolve(src);
    if (!abs || seen.has(abs)) return;
    seen.add(abs);
    const alt = clean($(el).attr('alt')) || undefined;
    const caption = clean($(el).closest('figure').find('figcaption').text()) || undefined;
    images.push({ url: abs, alt, caption });
  });

  return {
    source: 'file.org',
    url: 'https://file.org',
    slug: ext,
    extension: ext,
    name,
    summary,
    programs,
    images: images.length ? images.slice(0, 8) : undefined,
  };
}
