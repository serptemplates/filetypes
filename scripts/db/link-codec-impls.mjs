#!/usr/bin/env node
// Link FFmpeg implementation codec IDs to curated codec families

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_FILE = path.resolve('.data', 'filetypes.db');
const MAP_FILE = path.resolve('scripts', 'data', 'codec-impl-map.json');

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
let db;
if (fs.existsSync(DB_FILE)) db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
else db = new SQL.Database();

function query(sql, params={}) {
  const res = db.exec(sql, params)[0];
  if (!res) return [];
  return res.values.map(row => Object.fromEntries(res.columns.map((c,i)=>[c,row[i]])));
}

const families = new Set(query('SELECT id FROM codecs').map(r => String(r.id).toLowerCase()));
const impls = query("SELECT impl_id FROM codec_impls WHERE source='ffmpeg'").map(r => String(r.impl_id).toLowerCase());
const mapRules = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

function applyRules(id) {
  for (const r of mapRules) {
    if (r.when === 'id' && id === String(r.equals).toLowerCase()) return r.family;
    if (r.when === 'id_startswith' && id.startsWith(String(r.prefix).toLowerCase())) return r.family;
  }
  return null;
}

db.run('BEGIN');
try {
  db.run("DELETE FROM codec_family_impls WHERE source='ffmpeg'");
  let linked = 0, identity = 0, viaRule = 0;
  for (const id of impls) {
    let fam = null;
    if (families.has(id)) { fam = id; identity++; }
    else {
      const via = applyRules(id);
      if (via && families.has(via)) { fam = via; viaRule++; }
    }
    if (fam) {
      db.run('INSERT OR REPLACE INTO codec_family_impls (family_id, source, impl_id) VALUES (?, ?, ?)', [fam, 'ffmpeg', id]);
      linked++;
    }
  }
  db.run('COMMIT');
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  db.close();
  console.log(`Linked ${linked}/${impls.length} impls → families (identity=${identity}, viaRules=${viaRule})`);
} catch (e) {
  db.run('ROLLBACK');
  db.close();
  console.error('Linking failed:', e);
  process.exit(1);
}

