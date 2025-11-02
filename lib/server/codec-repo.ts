import { getDb } from './db';

export type DbCodec = {
  id: string;
  kind: string;
  name: string;
  summary?: string;
  year?: number;
  spec_url?: string;
  aliases?: string[];
  containers?: string[];
  mimes?: string[];
  content_md?: string;
  sources?: Array<{ label?: string; url: string }>;
};

function rowToCodec(row: any): DbCodec {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    summary: row.summary || undefined,
    year: row.year || undefined,
    spec_url: row.spec_url || undefined,
    aliases: row.aliases_json ? JSON.parse(String(row.aliases_json)) : [],
    containers: row.containers_json ? JSON.parse(String(row.containers_json)) : [],
    mimes: row.mimes_json ? JSON.parse(String(row.mimes_json)) : [],
    content_md: row.content_md || undefined,
    sources: row.sources_json ? JSON.parse(String(row.sources_json)) : undefined,
  };
}

export async function listCodecs(kind?: string, limit = 200): Promise<DbCodec[]> {
  const db = await getDb();
  const sql = kind ? 'SELECT * FROM codecs WHERE kind = $k ORDER BY id LIMIT $l' : 'SELECT * FROM codecs ORDER BY kind, id LIMIT $l';
  const params = kind ? { $k: kind, $l: limit } : { $l: limit };
  const res = db.exec(sql, params)[0];
  if (!res) return [];
  return res.values.map((row: any[]) => rowToCodec(Object.fromEntries(res.columns.map((c: string, i: number) => [c, row[i]]))));
}

export async function getCodec(id: string): Promise<DbCodec | null> {
  const db = await getDb();
  const res = db.exec('SELECT * FROM codecs WHERE id = $id', { $id: id })[0];
  if (!res || !res.values.length) return null;
  const row = Object.fromEntries(res.columns.map((c: string, i: number) => [c, res.values[0][i]]));
  return rowToCodec(row);
}

export async function findCodecByIdentifier(identifier: string): Promise<DbCodec | null> {
  const db = await getDb();
  const id = String(identifier || '').toLowerCase();
  const res = db.exec('SELECT * FROM codecs LIMIT 1000')[0];
  if (!res) return null;
  for (const vals of res.values) {
    const row = Object.fromEntries(res.columns.map((c: string, i: number) => [c, vals[i]]));
    const c = rowToCodec(row);
    if (c.id.toLowerCase() === id) return c;
    if ((c.aliases || []).map(a => a.toLowerCase()).includes(id)) return c;
  }
  return null;
}
