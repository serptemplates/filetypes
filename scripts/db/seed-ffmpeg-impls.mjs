#!/usr/bin/env node
// Seed FFmpeg implementation codec list into codec_impls

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_FILE = path.resolve('.data', 'filetypes.db');
const OUT_DIR = path.resolve('scraper', 'out-ffmpeg');
const IDS_FILE = path.join(OUT_DIR, 'codec-ids.json');
const ROLES_FILE = path.join(OUT_DIR, 'codecs.json');

if (!fs.existsSync(IDS_FILE)) {
  console.error('Missing FFmpeg codec ids file:', IDS_FILE);
  console.error('Run: pnpm -C scraper fetch:ffmpeg:codecs && node scraper/scripts/fetch-ffmpeg-codec-ids.mjs');
  process.exit(1);
}

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
let db;
if (fs.existsSync(DB_FILE)) db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
else db = new SQL.Database();

const ids = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8'));
let roles = [];
try { roles = JSON.parse(fs.readFileSync(ROLES_FILE, 'utf8')); } catch {}
const roleMap = new Map(roles.map(r => [String(r.id).toLowerCase(), r]));

db.run('BEGIN');
try {
  // Clear previous ffmpeg source
  db.run("DELETE FROM codec_impls WHERE source = 'ffmpeg'");
  let count = 0;
  for (const r of ids) {
    const id = String(r.id).toLowerCase();
    const role = roleMap.get(id);
    const kinds = Array.isArray(r.kinds) ? r.kinds : r.kind ? [r.kind] : [];
    const kind = kinds[0] || r.kind || 'other';
    const decoder = role ? (role.decoder ? 1 : 0) : null;
    const encoder = role ? (role.encoder ? 1 : 0) : null;
    const desc = role?.desc || null;
    db.run(
      'INSERT OR REPLACE INTO codec_impls (source, impl_id, kind, decoder, encoder, desc) VALUES (?, ?, ?, ?, ?, ?)',
      ['ffmpeg', id, kind, decoder, encoder, desc]
    );
    count++;
  }
  db.run('COMMIT');
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  db.close();
  console.log(`Seeded ${ids.length} ffmpeg codec impls into ${DB_FILE}`);
} catch (e) {
  db.run('ROLLBACK');
  db.close();
  console.error('Seed ffmpeg impls failed:', e);
  process.exit(1);
}

