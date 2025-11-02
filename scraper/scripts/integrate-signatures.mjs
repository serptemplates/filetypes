#!/usr/bin/env node
// Copy out-signatures into public/data/signatures

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..', 'out-signatures');
const DEST = path.resolve(__dirname, '..', '..', 'public', 'data', 'signatures');

if (!fs.existsSync(SRC)) {
  console.error('No out-signatures directory. Run: pnpm -C scraper build-signatures');
  process.exit(1);
}

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

for (const f of fs.readdirSync(SRC)) {
  fs.copyFileSync(path.join(SRC, f), path.join(DEST, f));
}

console.log(`Integrated signatures → ${DEST}`);

