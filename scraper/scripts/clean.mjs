#!/usr/bin/env node
// Clean scraped intermediate outputs. Usage:
//   pnpm clean                # remove out-sources, out, out-normalized
//   pnpm clean fileformat.com # remove only a specific source under out-sources

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_SOURCES = path.resolve(ROOT, 'out-sources');
const OUT = path.resolve(ROOT, 'out');
const OUT_NORM = path.resolve(ROOT, 'out-normalized');

const arg = process.argv[2]?.trim();

function rm(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log('✓ Removed', p);
  } catch (e) {
    console.warn('! Skip', p, e?.message || e);
  }
}

if (arg && arg !== 'all') {
  // remove only a specific source under out-sources
  const target = path.join(OUT_SOURCES, arg);
  rm(target);
} else {
  rm(OUT_SOURCES);
}

// Always clear merged and normalized outputs to avoid stale data
rm(OUT);
rm(OUT_NORM);

console.log('Done.');

