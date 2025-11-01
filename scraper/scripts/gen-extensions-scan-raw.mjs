#!/usr/bin/env node
// Aggregate extensions by scanning fetched HTML under scraper/raw/, plus
// existing JSON outputs and mime-db. Produces a deduped, lowercased list.
//
// Usage:
//   node scripts/gen-extensions-scan-raw.mjs [outputFile]
// Default output: scraper/data/extensions.txt

import fs from 'node:fs';
import path from 'node:path';
import mimeDb from 'mime-db';

const outArg = process.argv[2];
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const defaultOut = path.resolve(root, 'data', 'extensions.txt');
const outFile = outArg ? path.resolve(outArg) : defaultOut;

const RAW_DIR = path.resolve(root, 'raw');
const OUT_DIR = path.resolve(root, 'out');
const OUT_SOURCES = path.resolve(root, 'out-sources');

const exts = new Set();

function add(ext) {
  if (!ext) return;
  const e = String(ext).toLowerCase().replace(/^\.+/, '');
  if (/^[a-z0-9][a-z0-9.+-]*$/.test(e)) exts.add(e);
}

// 1) Seed from mime-db
for (const [, meta] of Object.entries(mimeDb)) {
  for (const ext of meta.extensions || []) add(ext);
}

// 2) Scan JSON outputs
function scanJsonDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) scanJsonDir(full);
    else if (entry.endsWith('.json')) {
      try {
        const rec = JSON.parse(fs.readFileSync(full, 'utf8'));
        // handle array or single
        if (Array.isArray(rec)) {
          for (const r of rec) add(r.extension || r.slug || r.ext);
        } else {
          add(rec.extension || rec.slug || rec.ext);
        }
      } catch {}
    }
  }
}
scanJsonDir(OUT_DIR);
scanJsonDir(OUT_SOURCES);

// 3) Scan raw HTML for link patterns
function collectFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, acc);
    else if (entry.isFile() && /\.(html?|xhtml)$/i.test(entry.name)) acc.push(full);
  }
  return acc;
}

const htmlFiles = collectFiles(RAW_DIR);
const rx = [
  /href=["'](?:https?:\/\/)?(?:www\.)?fileinfo\.com\/extension\/([A-Za-z0-9.+_-]+)/gi,
  /href=["'](?:https?:\/\/)?(?:www\.)?file\.org\/extension\/([A-Za-z0-9.+_-]+)/gi,
  /href=["'](?:https?:\/\/)?(?:www\.)?filext\.com\/file-extension\/([A-Za-z0-9.+_-]+)/gi,
  /href=["']\/extension\/([A-Za-z0-9.+_-]+)/gi, // relative links on fileinfo/file.org
  /href=["']\/file-extension\/([A-Za-z0-9.+_-]+)/gi // relative links on filext
];

for (const file of htmlFiles) {
  try {
    const html = fs.readFileSync(file, 'utf8');
    for (const r of rx) {
      let m;
      while ((m = r.exec(html)) !== null) add(m[1]);
    }
  } catch {}
}

const list = Array.from(exts).sort();
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, list.join('\n') + '\n');
console.log(`Aggregated ${list.length} extensions → ${outFile}`);

