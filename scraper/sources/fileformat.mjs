// Source parser: docs.fileformat.com -> normalized partial record
import * as cheerio from 'cheerio';

const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

export function detect(html) {
  const $ = cheerio.load(html);
  const canon = $('link[rel="canonical"]').attr('href') || '';
  const host = new URL(canon || 'https://docs.fileformat.com').host;
  // Prefer docs.fileformat.com explicitly; fall back to fileformat.com markers
  return host.includes('docs.fileformat.com') || canon.includes('fileformat.com');
}

function readSections($, headingIncludes = []) {
  const results = [];
  $('h2, h3').each((_, el) => {
    const heading = clean($(el).text());
    const low = heading.toLowerCase();
    if (headingIncludes.some(k => low.includes(k))) {
      let blocks = [];
      let sib = $(el).next();
      while (sib.length && !['H2','H3'].includes((sib[0].name || '').toUpperCase())) {
        const txt = clean(sib.text());
        if (txt) blocks.push(txt);
        sib = sib.next();
      }
      if (blocks.length) results.push(blocks.join('\n\n'));
    }
  });
  return results;
}

export function parse(html) {
  const $ = cheerio.load(html);
  // Try canonical first; if relative or missing, fall back to og:url
  let canon = $('link[rel="canonical"]').attr('href') || '';
  const ogUrl = $('meta[property="og:url"]').attr('content') || '';
  // Normalize canonical to absolute if needed
  if (canon && !/^https?:\/\//i.test(canon)) {
    // Resolve relative canonical against og:url or site root
    if (ogUrl && /^https?:\/\//i.test(ogUrl)) {
      try { canon = new URL(canon, ogUrl).href; } catch { canon = ogUrl; }
    } else {
      try { canon = new URL(canon, 'https://docs.fileformat.com').href; } catch { canon = 'https://docs.fileformat.com'; }
    }
  } else if (!canon) {
    canon = ogUrl || 'https://docs.fileformat.com';
  }

  // ex: https://docs.fileformat.com/image/heic/
  let segs = [];
  try {
    const urlObj = new URL(canon);
    segs = urlObj.pathname.split('/').filter(Boolean);
  } catch {
    segs = [];
  }
  const ext = (segs[segs.length - 1] || '').toLowerCase();
  const cat = (segs[segs.length - 2] || '').toLowerCase();
  if (!ext) return null;

  const name = clean($('h1, h2').first().text()) || `${ext.toUpperCase()} File`;
  const summary = clean($('p').first().text()) || undefined;

  // Technical/spec sections
  const technicalBlocks = readSections($, ['technical', 'specification', 'format specification', 'structure']);

  // How to open / convert
  const howOpenBlocks = readSections($, ['how to open', 'open', 'view']);
  const howConvertBlocks = readSections($, ['convert', 'export']);

  // MIME types: scan code, lists, tables for type/subtype patterns
  const mimeSet = new Set();
  $('code, pre, li, td, p').each((_, el) => {
    const txt = clean($(el).text());
    (txt.match(/[a-z0-9.+-]+\/[a-z0-9.+-]+/ig) || []).forEach(m => mimeSet.add(m.toLowerCase()));
  });
  const mime = Array.from(mimeSet);

  // Related formats: internal links to other docs pages
  const relatedSet = new Set();
  $('a[href^="/"], a[href*="docs.fileformat.com"]').each((_, a) => {
    const href = ($(a).attr('href') || '').replace(/^https?:\/\/docs\.fileformat\.com/, '');
    const parts = href.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last !== ext) relatedSet.add(last.toLowerCase());
  });
  const related = Array.from(relatedSet).slice(0, 20);

  // Images
  const base = canon || 'https://docs.fileformat.com';
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
    source: 'fileformat.com',
    url: canon || 'https://docs.fileformat.com',
    slug: ext,
    extension: ext,
    name,
    summary,
    category: cat || undefined,
    category_slug: cat || undefined,
    technical_info: technicalBlocks.length ? { content: technicalBlocks } : undefined,
    how_to_open: howOpenBlocks.length ? { instructions: howOpenBlocks } : undefined,
    how_to_convert: howConvertBlocks.length ? { instructions: howConvertBlocks } : undefined,
    mime: mime.length ? mime : undefined,
    related: related.length ? related : undefined,
    images: images.length ? images.slice(0, 8) : undefined,
  };
}
