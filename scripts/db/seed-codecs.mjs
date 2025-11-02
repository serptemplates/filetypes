#!/usr/bin/env node
// Seed codecs into SQLite (sql.js) from scripts/data/codecs.json

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_FILE = path.resolve('.data', 'filetypes.db');
const SRC_FILE = path.resolve('scripts', 'data', 'codecs.json');

if (!fs.existsSync(SRC_FILE)) {
  console.error('Missing seed file:', SRC_FILE);
  process.exit(1);
}

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
let db;
if (fs.existsSync(DB_FILE)) db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
else db = new SQL.Database();

const codecs = JSON.parse(fs.readFileSync(SRC_FILE, 'utf8'));

db.run('BEGIN');
try {
  for (const c of codecs) {
    const aliases = JSON.stringify(c.aliases || []);
    const containers = JSON.stringify(c.containers || []);
    const mimes = JSON.stringify(c.mimes || []);
    const sources = JSON.stringify(c.sources || []);
    const content = c.content_md || null;
    let sql = 'INSERT OR REPLACE INTO codecs (id, kind, name, summary, year, spec_url, aliases_json, containers_json, mimes_json, content_md, sources_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    let params = [c.id, c.kind, c.name, c.summary || null, c.year || null, c.spec_url || null, aliases, containers, mimes, content, sources];
    // Fallback for older DBs without new columns
    try { db.run(sql, params); }
    catch {
      sql = 'INSERT OR REPLACE INTO codecs (id, kind, name, summary, year, spec_url, aliases_json, containers_json, mimes_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      params = [c.id, c.kind, c.name, c.summary || null, c.year || null, c.spec_url || null, aliases, containers, mimes];
      db.run(sql, params);
    }
  }
  db.run('COMMIT');
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  db.close();
  console.log(`Seeded ${codecs.length} codecs into ${DB_FILE}`);
} catch (e) {
  db.run('ROLLBACK');
  db.close();
  console.error('Seed codecs failed:', e);
  process.exit(1);
}
