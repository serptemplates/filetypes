#!/usr/bin/env node
// parse-all.mjs
// Detects source (file.org or fileinfo.com) for each HTML in raw/ and parses
// into a normalized JSON record written to out/.

import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const RAW_DIR = path.resolve('..', 'raw');
const OUT_DIR = path.resolve('..', 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function parseFileOrg($) {
  // Heuristic from existing parser
  const title = clean($('h1').first().text()) || clean($('title').text());
  const m = title.match(/\.?([\w#&+-]+)\s+file/i);
  const ext = (m ? m[1] : '').toLowerCase();
  if (!ext) return null;

  // Summary/name
  const name = (() => {
    const h2 = clean($('h2').first().text());
    if (h2 && !/programs|software/i.test(h2)) return h2;
    const p = clean($('p').first().text());
    return p ? p.split('.')[0] : `.${ext.toUpperCase()} file`;
  })();

  // Programs (basic)
  const programs = {};
  const all = [];
  $('table tr').each((_, row) => {
    const link = $(row).find('td.w-100 a').first().attr('href')
      ? $(row).find('td.w-100 a').first()
      : $(row).find('td a').first();
    if (link && link.length) {
      const name = clean(link.text());
      const url = link.attr('href');
      if (name && url && !name.match(/File Types|Software|Help Center|Random Extension|More Information|How to Open/i)) {
        all.push({ name, url: url.startsWith('http') ? url : `https://file.org${url}` });
      }
    }
  });
  if (all.length) programs['windows'] = all.slice(0, 10);

  const summary = clean($('p').first().text()) || undefined;

  return {
    slug: ext,
    extension: ext,
    name,
    category: undefined,
    category_slug: undefined,
    summary,
    programs: Object.keys(programs).length ? programs : undefined,
    last_updated: new Date().toISOString(),
    sources: [{ url: 'file.org', retrieved_at: new Date().toISOString() }]
  };
}

function parseFileInfo($) {
  // Try canonical href first: https://fileinfo.com/extension/xcworkspace
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const mCanon = canonical.match(/\/extension\/(.+)$/);
  const extFromCanon = mCanon ? mCanon[1].toLowerCase() : '';

  // Fallback: title like "EXT File - What is it ..."
  const title = clean($('title').text());
  const mTitle = title.match(/^([^.\s]+) File/i);
  const ext = (extFromCanon || (mTitle ? mTitle[1] : '')).toLowerCase();
  if (!ext) return null;

  // Display name: use main heading if present, else title remainder
  const h1 = clean($('h1').first().text());
  const name = h1 || `${ext.toUpperCase()} File`;

  // Summary from meta description
  const summary = clean($('meta[name="description"]').attr('content')) || undefined;

  // Programs: FileInfo often lists under an apps table; keep minimal for now
  let programs;
  const progList = [];
  $('a').each((_, a) => {
    const href = $(a).attr('href') || '';
    const txt = clean($(a).text());
    if (href.includes('/software/') && txt && txt.length < 80) {
      progList.push({ name: txt, url: href.startsWith('http') ? href : `https://fileinfo.com${href}` });
    }
  });
  if (progList.length) programs = { windows: progList.slice(0, 10) };

  return {
    slug: ext,
    extension: ext,
    name,
    category: undefined,
    category_slug: undefined,
    summary,
    programs,
    last_updated: new Date().toISOString(),
    sources: [{ url: 'fileinfo.com', retrieved_at: new Date().toISOString() }]
  };
}

const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.html'));
let parsed = 0;
for (const file of files) {
  const full = path.join(RAW_DIR, file);
  const html = fs.readFileSync(full, 'utf8');
  const $ = cheerio.load(html);
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  let rec = null;
  if (canonical.includes('fileinfo.com')) {
    rec = parseFileInfo($);
  } else {
    rec = parseFileOrg($);
  }
  if (!rec) {
    console.warn('Skipping (unparsed):', file);
    continue;
  }
  const outPath = path.join(OUT_DIR, `${rec.slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(rec, null, 2));
  parsed++;
}

console.log('Parsed', parsed, 'records');

