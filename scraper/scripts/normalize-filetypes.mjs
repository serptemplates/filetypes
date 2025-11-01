#!/usr/bin/env node
// Validate and normalize merged FileType records with Zod, writing to out-normalized/
// Usage: node scripts/normalize-filetypes.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IN = path.resolve(ROOT, 'out');
const OUT = path.resolve(ROOT, 'out-normalized');

fs.mkdirSync(OUT, { recursive: true });

// Dynamically import the TS Zod schema via ts-node/register if available; otherwise fallback to a local minimal check
let FileTypeSchema;
try {
  const modUrl = pathToFileURL(path.resolve(ROOT, '..', 'schemas', 'filetype.ts')).href;
  ({ FileTypeSchema } = await import(modUrl));
} catch (e) {
  console.warn('Falling back: could not import TS schema, doing minimal validation only. Error:', e.message);
}

const files = fs.readdirSync(IN).filter(f => f.endsWith('.json'));
let ok = 0, bad = 0;
for (const f of files) {
  const src = path.join(IN, f);
  const dst = path.join(OUT, f);
  try {
    const rec = JSON.parse(fs.readFileSync(src, 'utf8'));
    // Minimal normalization
    rec.slug = String(rec.slug || rec.extension || path.basename(f, '.json')).toLowerCase();
    rec.extension = String(rec.extension || rec.slug).toLowerCase();
    rec.name = rec.name || rec.extension.toUpperCase() + ' File';
    rec.mime = Array.isArray(rec.mime) ? Array.from(new Set(rec.mime.map(String))) : rec.mime;
    rec.related = Array.isArray(rec.related) ? Array.from(new Set(rec.related.map(String))) : rec.related;
    if (FileTypeSchema) {
      const valid = FileTypeSchema.parse(rec);
      fs.writeFileSync(dst, JSON.stringify(valid, null, 2));
    } else {
      fs.writeFileSync(dst, JSON.stringify(rec, null, 2));
    }
    ok++;
  } catch (err) {
    console.error('Normalize failed for', f, err.message);
    bad++;
  }
}

console.log(`Normalized ${ok} records, ${bad} failed. Output: ${OUT}`);

