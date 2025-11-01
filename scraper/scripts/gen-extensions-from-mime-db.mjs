#!/usr/bin/env node
// Generate a deduplicated, lowercased list of extensions from mime-db.
// Usage:
//   node scripts/gen-extensions-from-mime-db.mjs [outputFile]
// Default output: scraper/data/extensions.txt

import fs from 'node:fs';
import path from 'node:path';
import mimeDb from 'mime-db';

const outArg = process.argv[2];
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const defaultOut = path.resolve(root, 'data', 'extensions.txt');
const outFile = outArg ? path.resolve(outArg) : defaultOut;

const set = new Set();
for (const [, meta] of Object.entries(mimeDb)) {
  for (const ext of meta.extensions || []) {
    if (!ext) continue;
    set.add(String(ext).toLowerCase());
  }
}

const list = Array.from(set).sort();
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, list.join('\n') + '\n');
console.log(`Wrote ${list.length} extensions to ${outFile}`);

