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
const data = db.export();
fs.writeFileSync(DB_FILE, Buffer.from(data));
console.log(`Migrated SQLite schema (sql.js) → ${DB_FILE}`);
