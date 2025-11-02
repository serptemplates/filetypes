#!/usr/bin/env node
// Copy scraper/out-mime into app public data under /public/data/mime

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC = path.resolve(__dirname, '..', 'out-mime');
const DEST = path.resolve(__dirname, '..', '..', 'public', 'data', 'mime');

if (!fs.existsSync(SRC)) {
  console.error('No out-mime directory. Run: pnpm -C scraper build:mime');
  process.exit(1);
}

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

copyDir(SRC, DEST);
console.log(`Integrated MIME data → ${DEST}`);

