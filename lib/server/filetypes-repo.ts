import { getDb } from './db';

export type DbFileType = {
  slug: string;
  extension: string;
  name: string;
  summary?: string;
  developer?: string;
  category?: string;
  last_updated?: string;
};

export async function getFileTypeRaw(slug: string) {
  const db = await getDb();
  const ftRows = db.exec('SELECT * FROM file_types WHERE slug = $slug', { $slug: slug });
  const ft = ftRows[0]?.values?.[0];
  if (!ft) return null;
  const ftCols = ftRows[0].columns;
  const obj: any = Object.fromEntries(ftCols.map((c: string, i: number) => [c, ft[i]]));
  const mime = (db.exec('SELECT mime FROM file_type_mime WHERE file_type_slug = $slug', { $slug: slug })[0]?.values || []).map(v => v[0]);
  const containers = (db.exec('SELECT container FROM file_type_container WHERE file_type_slug = $slug', { $slug: slug })[0]?.values || []).map(v => v[0]);
  const related = (db.exec('SELECT related FROM file_type_related WHERE file_type_slug = $slug', { $slug: slug })[0]?.values || []).map(v => v[0]);
  const tech = (db.exec('SELECT content FROM file_type_technical WHERE file_type_slug = $slug', { $slug: slug })[0]?.values || []).map(v => v[0]);
  const howOpen = (db.exec('SELECT instruction FROM file_type_how_open WHERE file_type_slug = $slug', { $slug: slug })[0]?.values || []).map(v => v[0]);
  const howConvert = (db.exec('SELECT instruction FROM file_type_how_convert WHERE file_type_slug = $slug', { $slug: slug })[0]?.values || []).map(v => v[0]);
  const images = (db.exec('SELECT url, alt, caption FROM file_type_images WHERE file_type_slug = $slug', { $slug: slug })[0]?.values || []).map(v => ({ url: v[0], alt: v[1] || undefined, caption: v[2] || undefined }));
  const programsRows = db.exec('SELECT platform, name, url, license FROM file_type_programs WHERE file_type_slug = $slug', { $slug: slug })[0]?.values || [];
  const programs: Record<string, Array<{ name: string; url?: string; license?: string }>> = {};
  const normPlatform = (v: any): string | null => {
    if (!v) return null;
    const s = String(v).trim().toLowerCase();
    if (!s) return null;
    if (['win', 'windows', 'mswindows'].includes(s)) return 'win';
    if (['mac', 'macos', 'osx'].includes(s)) return 'mac';
    if (['lin', 'linux', 'gnu/linux', 'unix'].includes(s)) return 'linux';
    if (['and', 'android'].includes(s)) return 'android';
    if (['ios', 'iphone', 'ipad'].includes(s)) return 'ios';
    if (['web', 'browser', 'online'].includes(s)) return 'web';
    if (['cos', 'chromeos', 'chrome os'].includes(s)) return 'cos';
    return s; // fall back to original to avoid dropping data
  };
  for (const row of programsRows) {
    const keyRaw = row[0];
    const name = row[1];
    const url = row[2];
    const license = row[3];
    const key = normPlatform(keyRaw);
    if (!key || !name) continue;
    if (!programs[key]) programs[key] = [];
    programs[key].push({ name, url: url || undefined, license: license || undefined });
  }
  return {
    slug: obj.slug,
    extension: obj.extension,
    name: obj.name,
    summary: obj.summary,
    developer: obj.developer,
    category: obj.category,
    last_updated: obj.last_updated,
    mime: mime.length ? mime : undefined,
    containers: containers.length ? containers : undefined,
    related: related.length ? related : undefined,
    technical_info: tech.length ? { content: tech } : undefined,
    how_to_open: howOpen.length ? { instructions: howOpen } : undefined,
    how_to_convert: howConvert.length ? { instructions: howConvert } : undefined,
    images: images.length ? images : undefined,
    programs: Object.keys(programs).length ? programs : undefined,
  };
}

export async function listFileTypes(limit = 100, offset = 0) {
  const db = await getDb();
  const res = db.exec(`SELECT slug, extension, name, summary, category FROM file_types ORDER BY slug LIMIT $limit OFFSET $offset`, { $limit: limit, $offset: offset });
  const table = res[0];
  if (!table) return [];
  return table.values.map((row: any[]) => Object.fromEntries(table.columns.map((c: string, i: number) => [c, row[i]])));
}

export async function countFileTypes(): Promise<number> {
  const db = await getDb();
  const res = db.exec('SELECT COUNT(*) as cnt FROM file_types');
  const table = res[0];
  if (!table) return 0;
  const idx = table.columns.indexOf('cnt');
  return Number(table.values[0][idx] || 0);
}

export async function listFileTypesByCategory(category: string, limit = 1000, offset = 0) {
  const db = await getDb();
  const res = db.exec(
    `SELECT slug, extension, name, summary, category, developer FROM file_types WHERE category = $category ORDER BY slug LIMIT $limit OFFSET $offset`,
    { $category: category, $limit: limit, $offset: offset }
  );
  const table = res[0];
  if (!table) return [];
  return table.values.map((row: any[]) => Object.fromEntries(table.columns.map((c: string, i: number) => [c, row[i]])));
}

export async function countByCategory(): Promise<Record<string, number>> {
  const db = await getDb();
  const res = db.exec('SELECT category, COUNT(*) as cnt FROM file_types GROUP BY category');
  const table = res[0];
  const out: Record<string, number> = {};
  if (!table) return out;
  const catIdx = table.columns.indexOf('category');
  const cntIdx = table.columns.indexOf('cnt');
  for (const row of table.values) {
    const cat = row[catIdx] || 'misc';
    const n = Number(row[cntIdx] || 0);
    out[cat] = n;
  }
  return out;
}
