#!/usr/bin/env node
// Build container↔codec matrix from curated seeds

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SEED_CONTAINERS = path.resolve(ROOT, 'data', 'matrix', 'containers.json');
const SEED_MATRIX = path.resolve(ROOT, 'data', 'matrix', 'container-codecs.json');
const OUT = path.resolve(ROOT, 'out-matrix');
fs.mkdirSync(OUT, { recursive: true });

const containers = JSON.parse(fs.readFileSync(SEED_CONTAINERS, 'utf8'));
const matrix = JSON.parse(fs.readFileSync(SEED_MATRIX, 'utf8'));

// Write per-container files
for (const c of containers) {
  const row = matrix[c.slug] || {};
  const rec = { ...c, codecs: row };
  fs.writeFileSync(path.join(OUT, `${c.slug}.json`), JSON.stringify(rec, null, 2));
}

// Write index
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(containers, null, 2));
console.log(`Built matrix for ${containers.length} containers → ${OUT}`);

