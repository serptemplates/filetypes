#!/usr/bin/env node
// Validate and normalize merged FileType records with Zod, writing to out-normalized/
// Usage: node scripts/normalize-filetypes.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeRecord } from './lib/normalize-record.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IN = path.resolve(ROOT, 'out');
const OUT = path.resolve(ROOT, 'out-normalized');

fs.mkdirSync(OUT, { recursive: true });

// Dynamically import the TS Zod schema via ts-node/register if available; otherwise fallback to a local minimal check
let FileTypeSchema;
try {
  // Prefer runtime JS schema (no TS loader required)
  const modUrlJs = pathToFileURL(path.resolve(ROOT, '..', 'schemas', 'filetype.runtime.js')).href;
  ({ FileTypeSchema } = await import(modUrlJs));
} catch (eJs) {
  try {
    // Fallback to TS source for dev environments that support it
    const modUrlTs = pathToFileURL(path.resolve(ROOT, '..', 'schemas', 'filetype.ts')).href;
    ({ FileTypeSchema } = await import(modUrlTs));
  } catch (eTs) {
    console.warn('Falling back: could not import schema, doing minimal validation only. Error:', eTs.message || eJs.message);
  }
}

const files = fs.readdirSync(IN).filter(f => f.endsWith('.json') && f !== 'filetypes.json');
let ok = 0, bad = 0;
for (const f of files) {
  const src = path.join(IN, f);
  const dst = path.join(OUT, f);
  try {
    const rec = JSON.parse(fs.readFileSync(src, 'utf8'));
    const valid = normalizeRecord(rec, FileTypeSchema);
    fs.writeFileSync(dst, JSON.stringify(valid, null, 2));
    ok++;
  } catch (err) {
    console.error('Normalize failed for', f, err.message);
    bad++;
  }
}

console.log(`Normalized ${ok} records, ${bad} failed. Output: ${OUT}`);
