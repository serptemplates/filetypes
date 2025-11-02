#!/usr/bin/env node
// Update codec_impls.desc from scraper/out-ffmpeg/codec-desc.json (long_name)

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_FILE = path.resolve('.data', 'filetypes.db');
const SRC = path.resolve('scraper', 'out-ffmpeg', 'codec-desc.json');

if (!fs.existsSync(SRC)) {
  console.error('Missing codec-desc.json. Run: node scraper/scripts/fetch-ffmpeg-codec-desc.mjs');
  process.exit(1);
}

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
const db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
const descs = JSON.parse(fs.readFileSync(SRC, 'utf8'));

db.run('BEGIN');
let updated=0;
const rows = db.exec("SELECT impl_id FROM codec_impls WHERE source='ffmpeg'")[0];
if (rows) {
  const idIdx = rows.columns.indexOf('impl_id');
  for (const v of rows.values) {
    const id = String(v[idIdx]);
    const d = descs[id];
    if (d && d.long_name) {
      db.run("UPDATE codec_impls SET desc = $desc WHERE source='ffmpeg' AND impl_id = $id", { $desc: d.long_name, $id: id });
      updated++;
    }
  }
}
db.run('COMMIT');
const data = db.export();
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
fs.writeFileSync(DB_FILE, Buffer.from(data));
db.close();
console.log(`Updated ${updated} impl descriptions from codec_desc.c long_name`);

