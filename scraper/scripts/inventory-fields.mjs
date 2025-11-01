#!/usr/bin/env node
// Crawl local fetched HTML under scraper/raw/** and inventory distinct field labels
// across sources (fileinfo.com, file.org, filext.com, docs.fileformat.com).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

import * as fileorg from '../sources/fileorg.mjs';
import * as fileinfo from '../sources/fileinfo.mjs';
import * as filext from '../sources/filext.mjs';
import * as fileformat from '../sources/fileformat.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.resolve(ROOT, 'raw');
const OUT_DIR = path.resolve(ROOT, '..', 'out-sources');
fs.mkdirSync(OUT_DIR, { recursive: true });

const sources = [
  { key: 'fileformat.com', mod: fileformat },
  { key: 'fileinfo.com', mod: fileinfo },
  { key: 'file.org', mod: fileorg },
  { key: 'filext.com', mod: filext },
];

function collectFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, acc);
    else if (entry.isFile()) acc.push(full);
  }
  return acc;
}

function detectSource(html) {
  for (const s of sources) {
    try { if (s.mod.detect(html)) return s.key; } catch {}
  }
  // fallback heuristics by host mention
  if (/docs\.fileformat\.com|fileformat\.com/i.test(html)) return 'fileformat.com';
  if (/fileinfo\.com/i.test(html)) return 'fileinfo.com';
  if (/file\.org/i.test(html)) return 'file.org';
  if (/filext\.com/i.test(html)) return 'filext.com';
  return 'unknown';
}

function clean(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

function inventoryFor(html, sourceKey) {
  const $ = cheerio.load(html);
  const out = {
    headings: [], // h2/h3 labels
    table_labels: [], // likely left-column labels or <th>
    footer_labels: [], // e.g., Category, Updated
    phrases: [], // recurring inline phrases (Programs that open, How to open, etc.)
    jsonld_keys: [], // keys seen in any JSON-LD blobs
  };

  // Headings h2/h3 text
  $('h2, h3').each((_, el) => {
    const txt = clean($(el).text());
    if (txt) out.headings.push(txt);
  });

  // Table labels: th and first td of two-column rows
  $('th').each((_, el) => {
    const txt = clean($(el).text());
    if (txt) out.table_labels.push(txt);
  });
  $('tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length >= 2) {
      const left = clean($(tds[0]).text());
      if (left) out.table_labels.push(left);
    }
  });

  // Footer-ish labels (FileInfo has Category/Updated in a footer bar)
  $('footer, .ftfooter, .footer').each((_, el) => {
    const txt = clean($(el).text());
    if (txt) {
      // Extract recognizable tokens
      if (/Category:/i.test(txt)) out.footer_labels.push('Category');
      if (/Updated:/i.test(txt)) out.footer_labels.push('Updated');
    }
  });

  // Phrases we care about (scan headings and link/nav anchors)
  const look = [
    'What is', 'More Information', 'Common Filenames', 'How to open', 'How to create', 'How to convert',
    'Programs that open', 'Program List', 'We have identified', 'File Analyzer', 'Technical', 'Specification', 'Structure', 'Convert', 'Export', 'View'
  ];
  $('h1,h2,h3,a,nav,li').each((_, el) => {
    const txt = clean($(el).text());
    for (const k of look) if (txt && txt.toLowerCase().includes(k.toLowerCase())) out.phrases.push(k);
  });

  // JSON-LD keys
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const blob = $(el).text();
      const data = JSON.parse(blob);
      const collectKeys = (obj) => {
        if (obj && typeof obj === 'object') {
          for (const k of Object.keys(obj)) out.jsonld_keys.push(k);
          for (const v of Object.values(obj)) collectKeys(v);
        }
      };
      collectKeys(data);
    } catch {}
  });

  return out;
}

function tally() {
  const files = collectFiles(RAW_DIR);
  const perSource = {};
  const union = { headings: new Map(), table_labels: new Map(), footer_labels: new Map(), phrases: new Map(), jsonld_keys: new Map() };

  const bump = (map, key) => { map.set(key, (map.get(key) || 0) + 1); };

  for (const file of files) {
    let html = '';
    try { html = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const sourceKey = detectSource(html);
    if (!perSource[sourceKey]) perSource[sourceKey] = {
      files: 0,
      headings: new Map(),
      table_labels: new Map(),
      footer_labels: new Map(),
      phrases: new Map(),
      jsonld_keys: new Map(),
    };
    const inv = inventoryFor(html, sourceKey);
    perSource[sourceKey].files++;
    for (const h of inv.headings) bump(perSource[sourceKey].headings, h), bump(union.headings, h);
    for (const h of inv.table_labels) bump(perSource[sourceKey].table_labels, h), bump(union.table_labels, h);
    for (const h of inv.footer_labels) bump(perSource[sourceKey].footer_labels, h), bump(union.footer_labels, h);
    for (const h of inv.phrases) bump(perSource[sourceKey].phrases, h), bump(union.phrases, h);
    for (const h of inv.jsonld_keys) bump(perSource[sourceKey].jsonld_keys, h), bump(union.jsonld_keys, h);
  }

  const toSortedObj = (map) => Array.from(map.entries()).sort((a,b)=> b[1]-a[1]).map(([k,v])=>({ label:k, count:v }));

  const result = {
    sources: Object.fromEntries(Object.entries(perSource).map(([k, v]) => [k, {
      files: v.files,
      headings: toSortedObj(v.headings),
      table_labels: toSortedObj(v.table_labels),
      footer_labels: toSortedObj(v.footer_labels),
      phrases: toSortedObj(v.phrases),
      jsonld_keys: toSortedObj(v.jsonld_keys),
    }])),
    union: {
      headings: toSortedObj(union.headings),
      table_labels: toSortedObj(union.table_labels),
      footer_labels: toSortedObj(union.footer_labels),
      phrases: toSortedObj(union.phrases),
      jsonld_keys: toSortedObj(union.jsonld_keys),
    }
  };

  return result;
}

const result = tally();
const outPath = path.join(OUT_DIR, 'inventory.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('Wrote inventory to', outPath);
for (const [src, data] of Object.entries(result.sources)) {
  console.log(`\n=== ${src} (${data.files} files) ===`);
  const top = (arr) => arr.slice(0, 12).map(x=>x.label).join(', ');
  console.log('Headings:', top(data.headings));
  console.log('Table labels:', top(data.table_labels));
  console.log('Footer labels:', top(data.footer_labels));
  console.log('Phrases:', top(data.phrases));
  if (src === 'fileinfo.com') console.log('JSON-LD keys:', top(data.jsonld_keys));
}

