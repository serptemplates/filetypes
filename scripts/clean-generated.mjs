#!/usr/bin/env node
// Remove generated build/scrape artifacts to keep the repo lean.
// Safe default: removes .next, out, scraper raw/out*, out-sources, and stale _individual.
// It DOES NOT remove public/data/files/individual unless you pass --wipe-files.

import fs from 'node:fs';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const deep = args.has('--deep');
const wipeFiles = args.has('--wipe-files');
const keepDb = args.has('--keep-db');

const root = process.cwd();
const targets = [
  '.next',
  'out',
  'out-sources',
  'scraper/raw',
  'scraper/out',
  'scraper/out-normalized',
  'scraper/out-sources',
  'scraper/out-mime',
  'scraper/out-references',
  'scraper/raw/references',
  'public/data/files/_individual',
];

if (!keepDb) targets.push('.data');

if (deep && wipeFiles) {
  // Danger: this removes integrated JSON that some pages currently read.
  // Only use if you have fully migrated to DB-backed pages and APIs.
  targets.push('public/data/files/individual');
  targets.push('public/data/files/index.json');
  targets.push('public/data/files/alphabet-index.json');
  targets.push('public/data/files/search-index.json');
  targets.push('public/data/files/categories');
  targets.push('public/data/mime');
}

function rmrf(p) {
  if (!fs.existsSync(p)) return false;
  const stat = fs.lstatSync(p);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    for (const e of fs.readdirSync(p)) rmrf(path.join(p, e));
    fs.rmdirSync(p);
  } else {
    fs.unlinkSync(p);
  }
  return true;
}

let removed = 0;
for (const t of targets) {
  const p = path.join(root, t);
  try {
    if (rmrf(p)) {
      removed++;
      console.log(`removed ${t}`);
    }
  } catch (e) {
    console.error(`failed to remove ${t}:`, e.message);
    process.exitCode = 1;
  }
}

console.log(`Clean complete. Removed ${removed} paths.`);
