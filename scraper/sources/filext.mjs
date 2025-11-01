// Source parser: filext.com -> normalized partial record
import * as cheerio from 'cheerio';

const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

export function detect(html) {
  const $ = cheerio.load(html);
  const title = clean($('title').text()).toLowerCase();
  return title.includes('filext') || $('a[href*="filext.com"]').length > 0;
}

export function parse(html) {
  const $ = cheerio.load(html);
  const title = clean($('title').text());
  // e.g., ".EXT File Extension" or similar
  const m = title.match(/\.([A-Za-z0-9#&+-]+)\b/);
  const ext = (m ? m[1] : '').toLowerCase();
  if (!ext) return null;
  const h1 = clean($('h1').first().text());
  const name = h1 || `${ext.toUpperCase()} File`;
  const firstP = clean($('p').first().text());
  const summary = firstP || undefined;

  // Programs (very rough): look for links under likely sections
  const programs = {};
  const apps = [];
  $('a').each((_, a) => {
    const href = $(a).attr('href') || '';
    const txt = clean($(a).text());
    if (/download|software|program/i.test(href) && txt && txt.length < 100) {
      apps.push({ name: txt, url: href.startsWith('http') ? href : `https://filext.com${href}` });
    }
  });
  if (apps.length) programs['windows'] = apps.slice(0, 12);

  // Images
  const base = 'https://filext.com';
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
    source: 'filext.com',
    url: 'https://filext.com',
    slug: ext,
    extension: ext,
    name,
    summary,
    programs,
    images: images.length ? images.slice(0, 8) : undefined,
  };
}
