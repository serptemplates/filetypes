#!/usr/bin/env node
// Create a local SQLite database with our schema (D1-like)

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_DIR = path.resolve('.data');
const DB_FILE = path.join(DB_DIR, 'filetypes.db');
const SCHEMA = path.resolve('scripts', 'db', 'schema.sql');

fs.mkdirSync(DB_DIR, { recursive: true });

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
let db;
if (fs.existsSync(DB_FILE)) {
  const buf = fs.readFileSync(DB_FILE);
  db = new SQL.Database(new Uint8Array(buf));
} else {
  db = new SQL.Database();
}
const schemaSql = fs.readFileSync(SCHEMA, 'utf8');
db.run(schemaSql);
// Ensure newly added columns exist when table already present
function hasColumn(db, table, col) {
  const res = db.exec(`PRAGMA table_info(${table})`)[0];
  if (!res) return false;
  const idx = res.columns.indexOf('name');
  return res.values.some((row) => String(row[idx]) === col);
}
function addColumn(db, table, col, type) {
  db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
}
try {
  if (!hasColumn(db, 'codecs', 'content_md')) addColumn(db, 'codecs', 'content_md', 'TEXT');
  if (!hasColumn(db, 'codecs', 'sources_json')) addColumn(db, 'codecs', 'sources_json', 'TEXT');
} catch (e) {
  console.warn('Column ensure failed (non-fatal):', e?.message || e);
}
const data = db.export();
fs.writeFileSync(DB_FILE, Buffer.from(data));
console.log(`Migrated SQLite schema (sql.js) → ${DB_FILE}`);
