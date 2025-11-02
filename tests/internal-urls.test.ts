import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const RAW_BASE_URL = process.env.BASE_URL || '';
const DEFAULT_CANDIDATES = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
];
const CONCURRENCY = Number(process.env.CONCURRENCY || 25);
const MAX_URLS = Number(process.env.MAX_URLS || 0); // 0 = no limit
const DB_FILE = path.resolve('.data', 'filetypes.db');

async function ping(url: string): Promise<boolean> {
  try {
    // HEAD first; fallback to GET
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow' });
    }
    return res.status < 400;
  } catch {
    return false;
  }
}

async function resolveBaseUrl(): Promise<string | null> {
  const candidates: string[] = [];
  if (RAW_BASE_URL && /^https?:\/\//.test(RAW_BASE_URL)) candidates.push(RAW_BASE_URL);
  candidates.push(...DEFAULT_CANDIDATES);
  for (const c of candidates) {
    if (await ping(c)) return c.replace(/\/?$/, '/');
  }
  return null;
}

function query(db: any, sql: string, paramsObj: Record<string, any> = {}) {
  const res = db.exec(sql, paramsObj)[0];
  if (!res) return [] as any[];
  return res.values.map((row: any[]) => Object.fromEntries(res.columns.map((c: string, i: number) => [c, row[i]])));
}

function encSeg(s: string) { return encodeURIComponent(String(s || '')); }
function toCategoryUrlSlug(s: string) { return String(s || '').replace(/_/g, '-'); }

async function buildUrlList() {
  if (!fs.existsSync(DB_FILE)) throw new Error(`Missing DB at ${DB_FILE}. Seed it first.`);
  const SQL = await initSqlJs({ locateFile: (f: string) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f) });
  const db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILE)));

  const urls = new Set<string>();
  urls.add('/');
  urls.add('/categories/');
  urls.add('/mimetypes/');

  const catRows = query(db, 'SELECT DISTINCT category FROM file_types');
  for (const r of catRows) urls.add(`/categories/${toCategoryUrlSlug(r.category || 'misc')}/`);

  const ftRows = query(db, 'SELECT slug FROM file_types');
  for (const r of ftRows) urls.add(`/filetypes/${encSeg(r.slug)}/`);

  const typesRows = query(db, 'SELECT DISTINCT type FROM mimes');
  for (const t of typesRows) {
    const type = t.type as string;
    urls.add(`/mimetypes/${encSeg(type)}/`);
    const subRows = query(db, 'SELECT subtype FROM mimes WHERE type = $type', { $type: type });
    for (const s of subRows) urls.add(`/mimetypes/${encSeg(type)}/${encSeg(s.subtype)}/`);
  }

  return Array.from(urls);
}

describe('Internal URLs return non-error status', () => {
  it('fetches all known routes and finds no 4xx/5xx', async () => {
    // Quick ping to ensure server is up
    const base = await resolveBaseUrl();
    if (!base) throw new Error(`Server not reachable. Tried: ${[RAW_BASE_URL, ...DEFAULT_CANDIDATES].filter(Boolean).join(', ')}`);

    const list = await buildUrlList();
    const urls = MAX_URLS > 0 ? list.slice(0, MAX_URLS) : list;

    let i = 0;
    const failures: Array<{ url: string; status?: number; error?: string }> = [];
    async function worker() {
      while (true) {
        const idx = i++;
        if (idx >= urls.length) break;
        const u = urls[idx];
        const full = base + u.replace(/^\//, '');
        try {
          let res = await fetch(full, { method: 'HEAD', redirect: 'follow' });
          if (res.status === 405 || res.status === 501) {
            res = await fetch(full, { method: 'GET', redirect: 'follow' });
          }
          if (res.status >= 400) failures.push({ url: u, status: res.status });
        } catch (e: any) {
          failures.push({ url: u, error: e?.message || 'fetch failed' });
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    if (failures.length) {
      console.error(`\nFound ${failures.length} failing URLs (showing up to 50):`);
      for (const f of failures.slice(0, 50)) console.error(` - ${f.url} -> ${f.status || f.error}`);
    }
    expect(failures.length).toBe(0);
  }, 600000); // up to 10 minutes for large sites
});
