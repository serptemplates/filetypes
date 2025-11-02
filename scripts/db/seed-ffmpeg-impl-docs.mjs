#!/usr/bin/env node
// Seed codec_impl_docs from scraper/out-ffmpeg/impl-docs.json

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_FILE = path.resolve('.data', 'filetypes.db');
const SRC = path.resolve('scraper', 'out-ffmpeg', 'impl-docs.json');

if (!fs.existsSync(SRC)) {
  console.error('Missing impl docs JSON:', SRC);
  process.exit(1);
}

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
let db;
if (fs.existsSync(DB_FILE)) db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
else db = new SQL.Database();

const docs = JSON.parse(fs.readFileSync(SRC, 'utf8'));

db.run('BEGIN');
try {
  // Clear ffmpeg docs
  db.run("DELETE FROM codec_impl_docs WHERE source='ffmpeg'");
  let count=0;
  for (const d of docs) {
    const id = String(d.id || '').toLowerCase();
    const role = String(d.role || '').toLowerCase();
    const content = String(d.content || '').trim();
    if (!id || !role || !content) continue;
    db.run('INSERT OR REPLACE INTO codec_impl_docs (source, impl_id, role, content_md) VALUES (?, ?, ?, ?)', ['ffmpeg', id, role, content]);
    count++;
  }
  db.run('COMMIT');
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  db.close();
  console.log(`Seeded ${docs.length} impl docs (${count} written) into ${DB_FILE}`);
} catch (e) {
  db.run('ROLLBACK');
  db.close();
  console.error('Seed impl docs failed:', e);
  process.exit(1);
}

