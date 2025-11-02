import { getDb } from './db';

export async function getMimeRecord(type: string, subtype: string) {
  const db = await getDb();
  const full = `${type}/${subtype}`;
  const res = db.exec('SELECT full, type, subtype, iana_json FROM mimes WHERE full = $full', { $full: full });
  const table = res[0];
  if (!table || !table.values.length) return null;
  const row = Object.fromEntries(table.columns.map((c: string, i: number) => [c, table.values[0][i]]));
  const exts = (db.exec('SELECT extension FROM mime_extensions WHERE full = $full', { $full: full })[0]?.values || []).map(v => v[0]);
  const iana = row.iana_json ? JSON.parse(row.iana_json) : undefined;
  return { full: row.full, type: row.type, subtype: row.subtype, extensions: exts, iana };
}

export async function listMimes(limit = 1000, offset = 0) {
  const db = await getDb();
  const res = db.exec('SELECT full, type, subtype FROM mimes ORDER BY type, subtype LIMIT $limit OFFSET $offset', { $limit: limit, $offset: offset });
  const table = res[0];
  if (!table) return [];
  return table.values.map((row: any[]) => Object.fromEntries(table.columns.map((c: string, i: number) => [c, row[i]])));
}

export async function listMimesByExtension(ext: string) {
  const db = await getDb();
  const key = String(ext).toLowerCase().replace(/^\./, '');
  const res = db.exec('SELECT full FROM mime_extensions WHERE extension = $ext ORDER BY full', { $ext: key });
  const table = res[0];
  if (!table) return { extension: key, mimes: [] };
  return { extension: key, mimes: table.values.map((r: any[]) => r[0]) };
}

export async function listMimesByType(type: string) {
  const db = await getDb();
  const t = String(type).toLowerCase();
  const res = db.exec('SELECT subtype FROM mimes WHERE type = $type ORDER BY subtype', { $type: t });
  const table = res[0];
  const items = table ? table.values.map((r: any[]) => r[0]) : [];
  return { type: t, subtypes: items };
}

export async function listMimeTypesWithCounts() {
  const db = await getDb();
  const res = db.exec('SELECT type, COUNT(*) as cnt FROM mimes GROUP BY type ORDER BY type');
  const table = res[0];
  if (!table) return [] as Array<{ type: string; count: number }>;
  const tIdx = table.columns.indexOf('type');
  const cIdx = table.columns.indexOf('cnt');
  return table.values.map((row: any[]) => ({ type: row[tIdx], count: Number(row[cIdx] || 0) }));
}
