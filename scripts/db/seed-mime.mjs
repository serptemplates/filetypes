#!/usr/bin/env node
// Seed MIME tables from integrated JSON under public/data/mime

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_FILE = path.resolve('.data', 'filetypes.db');
const SRC_DIRS = [
  path.resolve('scraper', 'out-mime'),
  path.resolve('public', 'data', 'mime'),
];
let SRC_DIR = SRC_DIRS.find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());
if (!SRC_DIR) {
  console.error('No MIME source found. Build MIME outputs first.');
  process.exit(1);
}

if (!fs.existsSync(SRC_DIR)) {
  console.error('No MIME source found at', SRC_DIR);
  process.exit(1);
}

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
let db;
if (fs.existsSync(DB_FILE)) db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
else db = new SQL.Database();

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const index = readJson(path.join(SRC_DIR, 'index.json'));

db.run('BEGIN');
try {
  // Clear existing MIME data
  db.run('DELETE FROM mime_extensions');
  db.run('DELETE FROM mimes');

  let count = 0;
  for (const item of index) {
    const type = item.type;
    const subtype = item.subtype;
    const full = `${type}/${subtype}`;
    const file = path.join(SRC_DIR, type, `${subtype}.json`);
    if (!fs.existsSync(file)) continue;
    const rec = readJson(file);
    const iana = rec.iana ? JSON.stringify(rec.iana) : null;
    db.run('INSERT OR REPLACE INTO mimes (full, type, subtype, iana_json) VALUES (?, ?, ?, ?)', [full, type, subtype, iana]);
    const exts = rec.extensions || [];
    for (const ext of exts) {
      db.run('INSERT OR IGNORE INTO mime_extensions (full, extension) VALUES (?, ?)', [full, String(ext).toLowerCase()]);
    }
    count++;
  }

  db.run('COMMIT');
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  db.close();
  console.log(`Seeded ${index.length} MIME entries into ${DB_FILE}`);
} catch (e) {
  db.run('ROLLBACK');
  db.close();
  console.error('Seed MIME failed:', e);
  process.exit(1);
}
