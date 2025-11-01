#!/usr/bin/env node
// Merge normalized partials from out-sources/*/*.json into unified out/*.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pickLongest,
  cleanName,
  preferName,
  mergePrograms,
  unionStrings,
  unionHowTo,
  unionMagic,
  preferCategory,
  mergeImages,
} from './lib/merge-helpers.mjs';

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
let mergedCount = 0;
for (const [ext, recs] of byExt.entries()) {
  // Scalars: choose longest non-empty; Arrays/objects: union/simple
  const name = preferName(recs, ext);
  const summary = pickLongest(...recs.map(r => r.summary));
  const developer = pickLongest(...recs.map(r => r.developer));
  const technicalBlocks = recs.flatMap(r => r.technical_info?.content || []);
  const technical_info = technicalBlocks.length ? { content: Array.from(new Set(technicalBlocks)) } : undefined;
  const moreDescBlocks = recs.flatMap(r => r.more_information?.description || []);
  const more_information = moreDescBlocks.length ? { description: Array.from(new Set(moreDescBlocks)) } : undefined;
  const programs = mergePrograms(recs);
  const mime = unionStrings(recs, 'mime');
  const containers = unionStrings(recs, 'containers');
  const related = unionStrings(recs, 'related');
  const category = preferCategory(recs);
  const category_slug = category ? String(category).toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;
  const toUrl = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u)) ? u : undefined;
  const sources = recs.map(r => ({ url: toUrl(r.url || r.source), source: r.source, retrieved_at: new Date().toISOString() }));
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
    more_information,
    how_to_open,
    how_to_convert,
    common_filenames: common_filenames.length ? common_filenames : undefined,
    mime: mime.length ? mime : undefined,
    containers: containers.length ? containers : undefined,
    related: related.length ? related : undefined,
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
