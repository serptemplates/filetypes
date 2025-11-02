import { getDb } from './db';

export type Container = {
  slug: string;
  name: string;
  links?: Array<{ label?: string; url: string }>;
  codecs?: { video?: string[]; audio?: string[]; subtitle?: string[] };
};

export async function listContainers(): Promise<Container[]> {
  const db = await getDb();
  const res = db.exec('SELECT slug, name, links_json FROM containers ORDER BY slug')[0];
  if (!res) return [];
  const slugIdx = res.columns.indexOf('slug');
  const nameIdx = res.columns.indexOf('name');
  const linksIdx = res.columns.indexOf('links_json');
  return res.values.map(v => ({
    slug: String(v[slugIdx]),
    name: String(v[nameIdx]),
    links: v[linksIdx] ? JSON.parse(String(v[linksIdx])) : undefined,
  }));
}

export async function getContainer(slug: string): Promise<Container | null> {
  const db = await getDb();
  const row = db.exec('SELECT slug, name, links_json FROM containers WHERE slug = $s', { $s: slug })[0];
  if (!row || !row.values.length) return null;
  const v = row.values[0];
  const slugIdx = row.columns.indexOf('slug');
  const nameIdx = row.columns.indexOf('name');
  const linksIdx = row.columns.indexOf('links_json');
  const cont: Container = {
    slug: String(v[slugIdx]),
    name: String(v[nameIdx]),
    links: v[linksIdx] ? JSON.parse(String(v[linksIdx])) : undefined,
  };
  const mats = db.exec('SELECT kind, codec_id FROM container_codecs WHERE container_slug = $s', { $s: slug })[0];
  if (mats) {
    const kindIdx = mats.columns.indexOf('kind');
    const cidIdx = mats.columns.indexOf('codec_id');
    const map: any = { video: [], audio: [], subtitle: [] };
    for (const r of mats.values) {
      const k = String(r[kindIdx]);
      const c = String(r[cidIdx]);
      if (!map[k]) map[k] = [];
      map[k].push(c);
    }
    cont.codecs = map;
  }
  return cont;
}

