import { getDb } from './db';

export type CodecImpl = {
  source: string;
  impl_id: string;
  kind: string;
  decoder: number | null;
  encoder: number | null;
  desc?: string | null;
};

export async function countCodecImpls(): Promise<number> {
  const db = await getDb();
  const res = db.exec("SELECT COUNT(*) AS c FROM codec_impls WHERE source='ffmpeg'")[0];
  if (!res) return 0;
  const idx = res.columns.indexOf('c');
  return Number(res.values[0][idx] || 0);
}

export async function listCodecImpls(kind?: string, limit = 500): Promise<CodecImpl[]> {
  const db = await getDb();
  let sql = "SELECT source, impl_id, kind, decoder, encoder, desc FROM codec_impls WHERE source='ffmpeg'";
  const params: any = {};
  if (kind) { sql += " AND kind = $k"; params.$k = kind; }
  sql += " ORDER BY impl_id LIMIT $l";
  params.$l = limit;
  const res = db.exec(sql, params)[0];
  if (!res) return [];
  return res.values.map((row: any[]) => Object.fromEntries(res.columns.map((c: string, i: number) => [c, row[i]])) as CodecImpl);
}

export type CodecImplWithFamily = CodecImpl & { family_id?: string };

export async function listCodecImplsWithFamily(kind?: string, limit = 2000): Promise<CodecImplWithFamily[]> {
  const db = await getDb();
  let sql = "SELECT ci.source, ci.impl_id, ci.kind, ci.decoder, ci.encoder, ci.desc, cfi.family_id FROM codec_impls ci LEFT JOIN codec_family_impls cfi ON cfi.source = ci.source AND cfi.impl_id = ci.impl_id WHERE ci.source='ffmpeg'";
  const params: any = {};
  if (kind) { sql += " AND ci.kind = $k"; params.$k = kind; }
  sql += " ORDER BY ci.impl_id LIMIT $l";
  params.$l = limit;
  const res = db.exec(sql, params)[0];
  if (!res) return [];
  return res.values.map((row: any[]) => Object.fromEntries(res.columns.map((c: string, i: number) => [c, row[i]])) as CodecImplWithFamily);
}

export async function getCodecImplWithFamily(implId: string): Promise<CodecImplWithFamily | null> {
  const db = await getDb();
  const res = db.exec(
    "SELECT ci.source, ci.impl_id, ci.kind, ci.decoder, ci.encoder, ci.desc, cfi.family_id FROM codec_impls ci LEFT JOIN codec_family_impls cfi ON cfi.source = ci.source AND cfi.impl_id = ci.impl_id WHERE ci.source='ffmpeg' AND ci.impl_id = $id",
    { $id: implId }
  )[0];
  if (!res || !res.values.length) return null;
  const row = Object.fromEntries(res.columns.map((c: string, i: number) => [c, res.values[0][i]])) as any;
  return row as CodecImplWithFamily;
}

export async function listCodecImplDocs(implId: string): Promise<Array<{ role: string; content_md: string }>> {
  const db = await getDb();
  const res = db.exec("SELECT role, content_md FROM codec_impl_docs WHERE source='ffmpeg' AND impl_id = $id", { $id: implId })[0];
  if (!res) return [];
  const roleIdx = res.columns.indexOf('role');
  const contentIdx = res.columns.indexOf('content_md');
  return res.values.map(v => ({ role: String(v[roleIdx]), content_md: String(v[contentIdx]) }));
}

export type CodecImplWithFamilyDocs = CodecImplWithFamily & { doc_md?: string };

export async function listCodecImplsWithFamilyDocs(kind?: string, limit = 2000): Promise<CodecImplWithFamilyDocs[]> {
  const db = await getDb();
  let sql = "SELECT ci.source, ci.impl_id, ci.kind, ci.decoder, ci.encoder, ci.desc, cfi.family_id, (SELECT content_md FROM codec_impl_docs d WHERE d.source = ci.source AND d.impl_id = ci.impl_id LIMIT 1) AS doc_md FROM codec_impls ci LEFT JOIN codec_family_impls cfi ON cfi.source = ci.source AND cfi.impl_id = ci.impl_id WHERE ci.source='ffmpeg'";
  const params: any = {};
  if (kind) { sql += " AND ci.kind = $k"; params.$k = kind; }
  sql += " ORDER BY ci.impl_id LIMIT $l";
  params.$l = limit;
  const res = db.exec(sql, params)[0];
  if (!res) return [];
  return res.values.map((row: any[]) => Object.fromEntries(res.columns.map((c: string, i: number) => [c, row[i]])) as CodecImplWithFamilyDocs);
}
