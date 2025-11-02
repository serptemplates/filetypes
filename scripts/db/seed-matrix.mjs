#!/usr/bin/env node
// Seed containers and container↔codec matrix from scraper/out-matrix

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_FILE = path.resolve('.data', 'filetypes.db');
const SRC_DIR = path.resolve('scraper', 'out-matrix');

if (!fs.existsSync(SRC_DIR)) {
  console.error('Missing matrix outputs:', SRC_DIR);
  process.exit(1);
}

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
let db;
if (fs.existsSync(DB_FILE)) db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
else db = new SQL.Database();

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

const indexPath = path.join(SRC_DIR, 'index.json');
if (!fs.existsSync(indexPath)) {
  console.error('Missing index:', indexPath);
  process.exit(1);
}
const containers = readJson(indexPath);

db.run('BEGIN');
try {
  // Clear existing
  db.run('DELETE FROM container_codecs');
  db.run('DELETE FROM containers');
  let cCount = 0, mCount = 0;
  for (const c of containers) {
    const file = path.join(SRC_DIR, `${c.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const rec = readJson(file);
    const links = JSON.stringify(rec.links || []);
    db.run('INSERT OR REPLACE INTO containers (slug, name, links_json) VALUES (?, ?, ?)', [rec.slug, rec.name || c.name || rec.slug, links]);
    cCount++;
    const codecs = rec.codecs || {};
    for (const kind of Object.keys(codecs)) {
      for (const codecId of codecs[kind] || []) {
        db.run('INSERT OR IGNORE INTO container_codecs (container_slug, kind, codec_id) VALUES (?, ?, ?)', [rec.slug, kind, codecId]);
        mCount++;
      }
    }
  }
  db.run('COMMIT');
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  db.close();
  console.log(`Seeded ${cCount} containers and ${mCount} mappings into ${DB_FILE}`);
} catch (e) {
  db.run('ROLLBACK');
  db.close();
  console.error('Seed matrix failed:', e);
  process.exit(1);
}

