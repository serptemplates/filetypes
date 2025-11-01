#!/usr/bin/env node
// Merge normalized partials from out-sources/*/*.json into unified out/*.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_SOURCES = path.resolve(ROOT, 'out-sources');
const OUT_DIR = path.resolve(ROOT, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

const byExt = new Map();

// Load all partials
if (fs.existsSync(OUT_SOURCES)) {
  for (const src of fs.readdirSync(OUT_SOURCES)) {
    const dir = path.join(OUT_SOURCES, src);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      const ext = rec.extension?.toLowerCase();
      if (!ext) continue;
      if (!byExt.has(ext)) byExt.set(ext, []);
      byExt.get(ext).push(rec);
    }
  }
}

function pickLongest(...vals) {
  const arr = vals.filter(Boolean).map(String);
  if (!arr.length) return undefined;
  return arr.sort((a, b) => b.length - a.length)[0];
}

function cleanName(name, ext) {
  if (!name) return undefined;
  let n = String(name).trim();
  // Strip site phrasing like "What are ... files and how to open them"
  n = n.replace(/^What (is|are) [^.]+ files?.*$/i, '').trim();
  // Strip trailing "File Extension"
  n = n.replace(/\bFile\s*Extension\b/i, '').trim();
  // Strip dash suffix like " - Image File Format"
  n = n.replace(/\s*-\s*[^-]*File\s*Format$/i, '').trim();
  // If we nuked everything, fall back
  if (!n) n = ext.toUpperCase() + ' File';
  return n;
}

function preferName(records, ext) {
  // Prefer fileinfo type_name (e.g., "Zipped File") if present
  const fi = records.find(r => r.source === 'fileinfo.com' && r.type_name);
  if (fi?.type_name) return cleanName(fi.type_name, ext);
  // Next, prefer fileformat name (usually the raw format code like "ZIP")
  const ff = records.find(r => r.source === 'fileformat.com' && r.name);
  if (ff?.name) return cleanName(ff.name, ext);
  // Else pick the longest provided name and clean it
  const longest = pickLongest(...records.map(r => r.name));
  return cleanName(longest, ext);
}

function mergePrograms(records) {
  const acc = {};
  for (const r of records) {
    const p = r.programs || {};
    for (const [platform, list] of Object.entries(p)) {
      if (!acc[platform]) acc[platform] = [];
      for (const item of list) {
        const exists = acc[platform].some(x => x.name?.toLowerCase() === item.name?.toLowerCase());
        if (!exists) acc[platform].push(item);
      }
    }
  }
  // cap lengths for sanity
  for (const k of Object.keys(acc)) acc[k] = acc[k].slice(0, 20);
  return Object.keys(acc).length ? acc : undefined;
}

function unionStrings(records, key) {
  const set = new Set();
  for (const r of records) {
    const val = r[key];
    if (Array.isArray(val)) val.forEach(v => v && set.add(String(v)));
  }
  return Array.from(set);
}

function unionHowTo(records, key) {
  const acc = new Set();
  for (const r of records) {
    const obj = r[key];
    if (obj && Array.isArray(obj.instructions)) {
      for (const s of obj.instructions) if (s) acc.add(String(s));
    }
  }
  const list = Array.from(acc);
  return list.length ? { instructions: list } : undefined;
}

function unionMagic(records) {
  const set = new Set();
  const out = [];
  for (const r of records) {
    for (const m of r.magic || []) {
      const key = `${m.hex}|${m.offset ?? ''}`;
      if (set.has(key)) continue;
      set.add(key);
      out.push({ hex: m.hex, offset: m.offset });
    }
  }
  return out.length ? out : undefined;
}

function preferCategory(records) {
  // Prefer category from fileformat.com, else any
  const ff = records.find(r => r.source === 'fileformat.com' && r.category);
  if (ff) return ff.category;
  const any = records.find(r => r.category);
  return any?.category;
}

let mergedCount = 0;
for (const [ext, recs] of byExt.entries()) {
  // Scalars: choose longest non-empty; Arrays/objects: union/simple
  const name = preferName(recs, ext);
  const summary = pickLongest(...recs.map(r => r.summary));
  const developer = pickLongest(...recs.map(r => r.developer));
  const technicalBlocks = recs.flatMap(r => r.technical_info?.content || []);
  const technical_info = technicalBlocks.length ? { content: Array.from(new Set(technicalBlocks)) } : undefined;
  const programs = mergePrograms(recs);
  const mime = unionStrings(recs, 'mime');
  const category = preferCategory(recs);
  const category_slug = category ? String(category).toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;
  const sources = recs.map(r => ({ url: r.url || r.source, source: r.source, retrieved_at: new Date().toISOString() }));
  const images = mergeImages(recs);
  const how_to_open = unionHowTo(recs, 'how_to_open');
  const how_to_convert = unionHowTo(recs, 'how_to_convert');
  const common_filenames = unionStrings(recs, 'common_filenames');
  const magic = unionMagic(recs);

  const unified = {
    slug: ext,
    extension: ext,
    name,
    summary,
    developer,
    category,
    category_slug,
    programs,
    technical_info,
    how_to_open,
    how_to_convert,
    common_filenames: common_filenames.length ? common_filenames : undefined,
    mime: mime.length ? mime : undefined,
    magic,
    images: images.length ? images : undefined,
    sources,
    last_updated: new Date().toISOString(),
  };

  const outPath = path.join(OUT_DIR, `${ext}.json`);
  fs.writeFileSync(outPath, JSON.stringify(unified, null, 2));
  mergedCount++;
}

console.log('Merged unified records:', mergedCount);
function mergeImages(records) {
  const out = [];
  const seen = new Set();
  for (const r of records) {
    for (const img of r.images || []) {
      if (!img?.url) continue;
      if (seen.has(img.url)) continue;
      seen.add(img.url);
      out.push({ url: img.url, alt: img.alt, caption: img.caption });
    }
  }
  return out.slice(0, 10);
}
