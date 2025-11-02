#!/usr/bin/env node
// Fetch IANA media type registration pages for all MIME entries we know about.
// Requires prior run of: pnpm -C scraper build:mime (to create out-mime/index.json)
// Usage: node scripts/fetch-iana-mime.mjs [--limit N]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INDEX = path.resolve(ROOT, 'out-mime', 'index.json');
const OUT = path.resolve(ROOT, 'raw', 'mime', 'iana');
fs.mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

const entries = JSON.parse(fs.readFileSync(INDEX, 'utf8'));

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchOne(full) {
  const [type, subtype] = full.split('/');
  const url = `https://www.iana.org/assignments/media-types/${type}/${subtype}`;
  const dir = path.join(OUT, type);
  const file = path.join(dir, `${subtype}.html`);
  if (fs.existsSync(file)) return { full, status: 'cached' };
  fs.mkdirSync(dir, { recursive: true });
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'serp-filetypes/1.0 (+https://serp.co)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    fs.writeFileSync(file, html);
    return { full, status: 'ok' };
  } catch (e) {
    return { full, status: 'error', error: e.message };
  }
}

const CONCURRENCY = 10;
let i = 0, ok = 0, cached = 0, err = 0;
const slice = entries.slice(0, Number.isFinite(LIMIT) ? LIMIT : entries.length);

async function run() {
  const queue = [...slice];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const rec = queue.shift();
      i++;
      const { full } = rec;
      const r = await fetchOne(full);
      if (r.status === 'ok') ok++; else if (r.status === 'cached') cached++; else err++;
      if (i % 50 === 0) console.log(`Fetched ${i}/${slice.length} (ok:${ok} cached:${cached} err:${err})`);
      // polite tiny delay
      await sleep(20);
    }
  });
  await Promise.all(workers);
  console.log(`Done. ok:${ok} cached:${cached} err:${err}. Saved to ${OUT}`);
}

run();

