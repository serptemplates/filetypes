// Source parser: fileinfo.com -> normalized partial record
import * as cheerio from 'cheerio';

const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

export function detect(html) {
  const $ = cheerio.load(html);
  const canon = $('link[rel="canonical"]').attr('href') || '';
  return canon.includes('fileinfo.com');
}

export function parse(html) {
  const $ = cheerio.load(html);
  const canon = $('link[rel="canonical"]').attr('href') || '';
  const mCanon = canon.match(/\/extension\/(.+)$/);
  const extFromCanon = mCanon ? mCanon[1].toLowerCase() : '';
  const title = clean($('title').text());
  const mTitle = title.match(/^([^.\s]+) File/i);
  const ext = (extFromCanon || (mTitle ? mTitle[1] : '')).toLowerCase();
  if (!ext) return null;

  const name = clean($('h1').first().text()) || `${ext.toUpperCase()} File`;
  const summary = clean($('meta[name="description"]').attr('content')) || undefined;

  // Developer (from headerInfo table) — prefer first filetype section
  let developer;
  const firstSection = $('section.filetype').first();
  const headerTables = firstSection.length ? firstSection.find('table.headerInfo') : $('table.headerInfo');
  headerTables.find('tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length >= 2) {
      const label = clean($(tds[0]).text());
      const value = clean($(tds[1]).text());
      if (!developer && /^Developer$/i.test(label) && value) developer = value;
    }
  });

  // Extract sectioned content from the first filetype section
  function extractSectionText(sectionRoot, headingMatch) {
    const texts = [];
    const heading = sectionRoot.find('h3').filter((_, el) => headingMatch.test(clean($(el).text()))).first();
    if (!heading.length) return texts;
    let sib = heading.next();
    while (sib.length && sib[0].tagName && !/^h3$/i.test(sib[0].tagName)) {
      // collect paragraphs and list items
      sib.find('p, li').each((_, el) => {
        const t = clean($(el).text());
        if (t) texts.push(t);
      });
      const direct = clean(sib.text());
      if (direct && texts.length === 0) texts.push(direct);
      sib = sib.next();
    }
    return texts;
  }

  // Generic: map all h3 sections under the first filetype block
  function extractAllSectionBlocks(sectionRoot) {
    const out = {};
    sectionRoot.find('h3').each((_, el) => {
      const heading = clean($(el).text());
      if (!heading) return;
      const blocks = [];
      let sib = $(el).next();
      while (sib.length && sib[0].tagName && !/^h3$/i.test(sib[0].tagName)) {
        sib.find('p, li').each((_, node) => {
          const t = clean($(node).text());
          if (t) blocks.push(t);
        });
        const direct = clean(sib.text());
        if (direct && blocks.length === 0) blocks.push(direct);
        sib = sib.next();
      }
      if (blocks.length) out[heading.toLowerCase()] = blocks;
    });
    return out;
  }

  const firstType = firstSection.length ? firstSection : $('section.filetype').first();
  const typeName = clean(firstType.find('h2.title').first().text()) || undefined;
  const commonFilenames = [];
  // Common Filenames
  firstType.find('h3').each((_, el) => {
    const txt = clean($(el).text());
    if (/^Common Filenames/i.test(txt)) {
      let sib = $(el).next();
      while (sib.length && sib[0].tagName && !/^h3$/i.test(sib[0].tagName)) {
        sib.find('li').each((_, li) => {
          const t = clean($(li).text());
          if (t) commonFilenames.push(t);
        });
        sib = sib.next();
      }
    }
  });

  const howOpenTexts = extractSectionText(firstType, /^How to open/i);
  const howConvertTexts = extractSectionText(firstType, /^How to convert/i);
  const allBlocks = extractAllSectionBlocks(firstType);

  // Derive "what is"/overview content
  let overview = [];
  for (const key of Object.keys(allBlocks)) {
    if (key.startsWith('what is')) { overview = allBlocks[key]; break; }
  }
  if (!overview.length) {
    const metaDesc = clean($('meta[name="description"]').attr('content'));
    if (metaDesc) overview = [metaDesc];
  }

  // Derive technical/spec content (format/specification sections)
  const technicalBlocks = [];
  for (const [key, blocks] of Object.entries(allBlocks)) {
    if (/(format|specification|structure|codec|container)/i.test(key)) {
      technicalBlocks.push(...blocks);
    }
  }

  // Programs (shallow): detect software links
  const programs = {};
  const apps = [];
  $('a[href*="/software/"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    const txt = clean($(a).text());
    if (txt && txt.length < 100) {
      apps.push({ name: txt, url: href.startsWith('http') ? href : `https://fileinfo.com${href}` });
    }
  });
  if (apps.length) programs['windows'] = apps.slice(0, 12);

  // Images (absolute URLs with optional captions)
  const base = canon || 'https://fileinfo.com';
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
    source: 'fileinfo.com',
    url: canon || 'https://fileinfo.com',
    slug: ext,
    extension: ext,
    name,
    type_name: typeName,
    summary,
    developer,
    more_information: overview.length ? { description: overview } : undefined,
    technical_info: technicalBlocks.length ? { content: technicalBlocks } : undefined,
    common_filenames: commonFilenames.length ? commonFilenames : undefined,
    how_to_open: howOpenTexts.length ? { instructions: howOpenTexts } : undefined,
    how_to_convert: howConvertTexts.length ? { instructions: howConvertTexts } : undefined,
    programs,
    images: images.length ? images.slice(0, 8) : undefined,
  };
}
