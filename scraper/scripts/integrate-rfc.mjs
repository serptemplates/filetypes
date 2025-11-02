#!/usr/bin/env node
// Copy RFC text + JSON into public/data/references/rfc

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.resolve(__dirname, '..', 'raw', 'references', 'rfc');
const OUT = path.resolve(__dirname, '..', 'out-references', 'rfc');
const DEST = path.resolve(__dirname, '..', '..', 'public', 'data', 'references', 'rfc');

fs.mkdirSync(DEST, { recursive: true });

function copyIfExists(srcDir, destDir, ext) {
  if (!fs.existsSync(srcDir)) return;
  for (const f of fs.readdirSync(srcDir)) {
    if (f.endsWith(ext)) fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
  }
}

copyIfExists(RAW, DEST, '.txt');
copyIfExists(OUT, DEST, '.json');

console.log(`Integrated RFC references → ${DEST}`);

