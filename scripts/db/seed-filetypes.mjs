#!/usr/bin/env node
// Seed SQLite DB (sql.js) from integrated JSON in public/data/files/individual

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DB_FILE = path.resolve('.data', 'filetypes.db');
const SRC_DIRS = [
  path.resolve('scraper', 'out-normalized'),
  path.resolve('scraper', 'out'),
  path.resolve('public', 'data', 'files', 'individual'),
];
let SRC_DIR = SRC_DIRS.find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());
if (!SRC_DIR) {
  console.error('No input directory found for filetypes. Run the scraper build first.');
  process.exit(1);
}

const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
let db;
if (fs.existsSync(DB_FILE)) db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
else db = new SQL.Database();

const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json'));
let count = 0;
db.run('BEGIN');
try {
  for (const file of files) {
    const rec = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
    const slug = rec.slug || rec.extension;
    if (!slug) continue;
    db.run(`INSERT OR REPLACE INTO file_types (slug, extension, name, summary, developer, category, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      slug,
      rec.extension,
      rec.name,
      rec.summary || null,
      rec.developer || null,
      rec.category || null,
      rec.last_updated || null,
    ]);
    db.run(`DELETE FROM file_type_mime WHERE file_type_slug = ?`, [slug]);
    db.run(`DELETE FROM file_type_container WHERE file_type_slug = ?`, [slug]);
    db.run(`DELETE FROM file_type_related WHERE file_type_slug = ?`, [slug]);
    db.run(`DELETE FROM file_type_programs WHERE file_type_slug = ?`, [slug]);
    db.run(`DELETE FROM file_type_images WHERE file_type_slug = ?`, [slug]);
    db.run(`DELETE FROM file_type_technical WHERE file_type_slug = ?`, [slug]);
    db.run(`DELETE FROM file_type_how_open WHERE file_type_slug = ?`, [slug]);
    db.run(`DELETE FROM file_type_how_convert WHERE file_type_slug = ?`, [slug]);

    for (const m of rec.mime || []) db.run(`INSERT OR IGNORE INTO file_type_mime (file_type_slug, mime) VALUES (?, ?)`, [slug, m]);
    for (const c of rec.containers || []) db.run(`INSERT OR IGNORE INTO file_type_container (file_type_slug, container) VALUES (?, ?)`, [slug, c]);
    for (const r of rec.related || []) db.run(`INSERT OR IGNORE INTO file_type_related (file_type_slug, related) VALUES (?, ?)`, [slug, r]);
    for (const img of rec.images || []) db.run(`INSERT INTO file_type_images (file_type_slug, url, alt, caption) VALUES (?, ?, ?, ?)`, [slug, img.url, img.alt || null, img.caption || null]);
    for (const t of rec.technical_info?.content || []) db.run(`INSERT INTO file_type_technical (file_type_slug, content) VALUES (?, ?)`, [slug, t]);
    for (const h of rec.how_to_open?.instructions || []) db.run(`INSERT INTO file_type_how_open (file_type_slug, instruction) VALUES (?, ?)`, [slug, h]);
    for (const h of rec.how_to_convert?.instructions || []) db.run(`INSERT INTO file_type_how_convert (file_type_slug, instruction) VALUES (?, ?)`, [slug, h]);
    const programs = rec.programs || {};
    for (const [platform, list] of Object.entries(programs)) {
      for (const p of list) db.run(`INSERT INTO file_type_programs (file_type_slug, platform, name, url, license) VALUES (?, ?, ?, ?, ?)`, [slug, platform, p.name, p.url || null, p.license || null]);
    }
    count++;
  }
  db.run('COMMIT');
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  db.close();
  console.log(`Seeded ${count} file types into ${DB_FILE}`);
} catch (e) {
  db.run('ROLLBACK');
  db.close();
  console.error('Seed failed:', e);
  process.exit(1);
}
