#!/usr/bin/env node
// Build signatures catalog from seed JSON (extend later with PRONOM/shared-mime-info/libmagic)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SEED = path.resolve(ROOT, 'data', 'signatures', 'seed.json');
const OUT = path.resolve(ROOT, 'out-signatures');
fs.mkdirSync(OUT, { recursive: true });

const seeds = JSON.parse(fs.readFileSync(SEED, 'utf8'));
for (const s of seeds) {
  const rec = {
    id: s.id,
    hex: s.hex,
    offset: s.offset ?? 0,
    description: s.description,
    detects: s.detects || [],
    sources: [
      { source: 'seed' }
    ],
  };
  fs.writeFileSync(path.join(OUT, `${s.id}.json`), JSON.stringify(rec, null, 2));
}

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(seeds.map(s => s.id), null, 2));
console.log(`Built ${seeds.length} signatures → ${OUT}`);

