#!/usr/bin/env node
// Seed references (RFCs) into DB from public/data/references/rfc

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_FILE = path.resolve('.data', 'filetypes.db');
const RFC_DIRS = [
  path.resolve('scraper', 'out-references', 'rfc'),
  path.resolve('public', 'data', 'references', 'rfc'),
];
let RFC_DIR = RFC_DIRS.find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());
if (!RFC_DIR) {
  console.error('No references source found.');
  process.exit(0);
}

if (!fs.existsSync(RFC_DIR)) {
  console.error('No RFC source found at', RFC_DIR);
  process.exit(0);
}

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
let db;
if (fs.existsSync(DB_FILE)) db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
else db = new SQL.Database();

const indexFile = path.join(RFC_DIR, 'index.json');
const ids = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : [];

db.run('BEGIN');
try {
  // remove existing RFC references
  db.run("DELETE FROM refs WHERE kind = 'rfc'");

  let count = 0;
  for (const id of ids) {
    const txt = path.join(RFC_DIR, `${id}.txt`);
    const meta = path.join(RFC_DIR, `${id}.json`);
    if (!fs.existsSync(txt)) continue;
    const body = fs.readFileSync(txt, 'utf8');
    const m = fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, 'utf8')) : { title: `RFC ${id}`, url: `https://www.rfc-editor.org/rfc/rfc${id}.html` };
    db.run('INSERT OR REPLACE INTO refs (kind, id, title, url, body) VALUES (?, ?, ?, ?, ?)', ['rfc', String(id), m.title || `RFC ${id}`, m.url || null, body]);
    count++;
  }

  db.run('COMMIT');
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  db.close();
  console.log(`Seeded ${ids.length} RFC references into ${DB_FILE}`);
} catch (e) {
  db.run('ROLLBACK');
  db.close();
  console.error('Seed references failed:', e);
  process.exit(1);
}
