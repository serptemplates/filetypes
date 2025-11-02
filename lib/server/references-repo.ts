import { getDb } from './db';

export async function getRfc(id: string) {
  const db = await getDb();
  const res = db.exec("SELECT id, title, url, body FROM refs WHERE kind = 'rfc' AND id = $id", { $id: String(id) });
  const table = res[0];
  if (!table || !table.values.length) return null;
  const row = Object.fromEntries(table.columns.map((c: string, i: number) => [c, table.values[0][i]]));
  return { id: row.id, title: row.title, url: row.url, body: row.body };
}
