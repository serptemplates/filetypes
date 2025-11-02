import { NextRequest, NextResponse } from 'next/server';
import { originFor, urlsetXml } from '@/app/sitemaps/_helpers';
import { getDb } from '@/lib/server/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const origin = originFor(req);
  const db = await getDb();
  const res = db.exec('SELECT slug, extension FROM file_types ORDER BY slug');
  const table = res[0];
  const slugIdx = table?.columns.indexOf('slug') ?? -1;
  const extIdx = table?.columns.indexOf('extension') ?? -1;
  const urls = (table?.values || []).map((row: any[]) => {
    const slug = String(row[slugIdx] || row[extIdx]);
    return { loc: `${origin}/filetypes/${slug}/` };
  });
  const xml = urlsetXml(urls);
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

