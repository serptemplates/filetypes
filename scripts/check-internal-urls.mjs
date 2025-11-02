#!/usr/bin/env node
// Crawl internal URLs (filetypes, mime, categories) and report non-2xx/3xx

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DB_FILE = path.resolve('.data', 'filetypes.db');

function toCategoryUrlSlug(s) { return String(s || '').replace(/_/g, '-'); }

async function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    console.error(`Missing DB at ${DB_FILE}. Run: pnpm run db:migrate && pnpm run db:seed:all`);
    process.exit(1);
  }
  const SQL = await initSqlJs({ locateFile: f => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
  return new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));
}

function query(db, sql, paramsObj = {}) {
  const res = db.exec(sql, paramsObj)[0];
  if (!res) return [];
  return res.values.map(row => Object.fromEntries(res.columns.map((c, i) => [c, row[i]])));
}

function encSeg(s) { return encodeURIComponent(String(s || '')); }

async function buildUrlList(db) {
  const urls = new Set();
  // Roots
  urls.add('/');
  urls.add('/categories/');
  urls.add('/mimetypes/');

  // Categories (from known keys in DB)
  const catRows = query(db, 'SELECT DISTINCT category FROM file_types');
  for (const r of catRows) {
    const cat = r.category || 'misc';
    urls.add(`/categories/${toCategoryUrlSlug(cat)}/`);
  }

  // Filetypes
  const ftRows = query(db, 'SELECT slug FROM file_types');
  for (const r of ftRows) {
    // Preserve dots and reserved chars via encodeURIComponent
    urls.add(`/filetypes/${encSeg(r.slug)}/`);
  }

  // MIME
  const typesRows = query(db, 'SELECT DISTINCT type FROM mimes');
  for (const t of typesRows) {
    const type = t.type;
    urls.add(`/mimetypes/${encSeg(type)}/`);
    const subRows = query(db, 'SELECT subtype FROM mimes WHERE type = $type', { $type: type });
    for (const s of subRows) {
      urls.add(`/mimetypes/${encSeg(type)}/${encSeg(s.subtype)}/`);
    }
  }

  return Array.from(urls);
}

async function checkAll(urls, base) {
  const failures = [];
  const ok = [];
  const limit = Number(process.env.CONCURRENCY || 20);
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= urls.length) break;
      const pathUrl = urls[idx];
      const full = base.replace(/\/?$/, '/') + pathUrl.replace(/^\//, '');
      try {
        // Try HEAD first (fast path), fallback to GET if method not allowed
        let res = await fetch(full, { method: 'HEAD', redirect: 'follow' });
        if (res.status === 405 || res.status === 501) {
          res = await fetch(full, { method: 'GET', redirect: 'follow' });
        }
        if (res.status >= 400) failures.push({ url: pathUrl, status: res.status });
        else ok.push(pathUrl);
      } catch (e) {
        failures.push({ url: pathUrl, error: e.message });
      }
    }
  }
  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
  return { ok, failures };
}

(async () => {
  const db = await loadDb();
  const urls = await buildUrlList(db);
  console.log(`Checking ${urls.length} internal URLs at ${BASE_URL}...`);
  const { ok, failures } = await checkAll(urls, BASE_URL);
  console.log(`Done. OK: ${ok.length}  Failures: ${failures.length}`);
  if (failures.length) {
    for (const f of failures.slice(0, 50)) {
      console.log(` - ${f.url} -> ${f.status || f.error}`);
    }
    if (failures.length > 50) console.log(` ... and ${failures.length - 50} more`);
    process.exitCode = 1;
  }
})();
