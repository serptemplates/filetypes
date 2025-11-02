#!/usr/bin/env node
// Build normalized MIME catalog from mime-db with stable paths.
// Output: scraper/out-mime/<type>/<subtype>.json and index files.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, 'out-mime');
fs.mkdirSync(OUT, { recursive: true });

// Load targets list for provenance
let targets = [];
try {
  const t = fs.readFileSync(path.resolve(ROOT, 'data', 'targets', 'mime.json'), 'utf8');
  targets = JSON.parse(t);
} catch {}

// Import mime-db (CJS -> ESM interop)
let mimeDB;
try {
  const mod = await import('mime-db');
  mimeDB = mod.default || mod;
} catch (e) {
  console.error('Failed to import mime-db. Ensure it is installed in scraper/package.json');
  process.exit(1);
}

const records = [];
for (const [full, meta] of Object.entries(mimeDB)) {
  const [type, subtypeRaw] = String(full).split('/');
  if (!type || !subtypeRaw) continue;
  const subtype = subtypeRaw.toLowerCase();
  const exts = Array.isArray(meta.extensions) ? Array.from(new Set(meta.extensions.map(String))) : [];
  const charsets = meta.charset ? [String(meta.charset)] : undefined;
  const prov = [
    { source: 'mime-db', url: 'https://www.npmjs.com/package/mime-db' },
  ];
  for (const t of targets) {
    if (t.crawl && String(t.crawl).toLowerCase() === 'skip') continue;
    prov.push({ source: t.id, url: t.url });
  }

  const rec = {
    type,
    subtype,
    full,
    extensions: exts,
    charsets,
    sources: prov,
  };

  // Write per-type/subtype file
  const dir = path.join(OUT, type);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${subtype}.json`);
  fs.writeFileSync(file, JSON.stringify(rec, null, 2));
  records.push(rec);
}

// Write index files
const indexPath = path.join(OUT, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify(records.map(r => ({ full: r.full, type: r.type, subtype: r.subtype, extensions: r.extensions })), null, 2));

// Extension → MIME map
const extMap = {};
for (const r of records) {
  for (const e of r.extensions || []) {
    if (!extMap[e]) extMap[e] = [];
    extMap[e].push(r.full);
  }
}
fs.writeFileSync(path.join(OUT, 'extensions.json'), JSON.stringify(extMap, null, 2));

console.log(`Built ${records.length} MIME records → ${OUT}`);
