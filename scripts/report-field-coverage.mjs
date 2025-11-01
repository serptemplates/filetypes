#!/usr/bin/env node
// Quick report of field presence across normalized JSONs (for completeness checks)

import fs from 'node:fs';
import path from 'node:path';

const candidates = [
  'scraper/out-normalized',
  'scraper/out',
  'public/data/files/individual',
];

let IN = null;
for (const c of candidates) {
  const p = path.resolve(c);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) { IN = p; break; }
}
if (!IN) throw new Error('No input directory found. Build scraper outputs first.');

const files = fs.readdirSync(IN).filter(f => f.endsWith('.json'));
const fields = [
  'summary', 'developer', 'category', 'category_slug', 'mime', 'containers', 'related',
  'technical_info', 'how_to_open', 'how_to_convert', 'common_filenames', 'magic', 'programs',
  'images', 'sources', 'last_updated'
];

const counts = Object.fromEntries(fields.map(f => [f, 0]));
const total = files.length;

for (const f of files) {
  const rec = JSON.parse(fs.readFileSync(path.join(IN, f), 'utf8'));
  for (const key of fields) {
    if (rec[key] != null) counts[key]++;
  }
}

console.log(`Coverage across ${total} records in ${IN}`);
for (const key of fields) {
  const n = counts[key];
  const pct = ((n / total) * 100).toFixed(1).padStart(5, ' ');
  console.log(` - ${key.padEnd(16)} ${String(n).padStart(5)} / ${String(total).padEnd(5)} (${pct}%)`);
}

