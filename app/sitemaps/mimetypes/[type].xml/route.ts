import { NextRequest, NextResponse } from 'next/server';
import { originFor, urlsetXml } from '@/app/sitemaps/_helpers';
import { getDb } from '@/lib/server/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const origin = originFor(req);
  const { type } = await params;
  const db = await getDb();
  const res = db.exec('SELECT subtype FROM mimes WHERE type = $t ORDER BY subtype', { $t: type })[0];
  if (!res) return new NextResponse('Not Found', { status: 404 });
  const subtypeIdx = res.columns.indexOf('subtype');
  const urls = res.values.map((row: any[]) => ({ loc: `${origin}/mimetypes/${type}/${encodeURIComponent(String(row[subtypeIdx]))}/` }));
  // include type index page
  urls.push({ loc: `${origin}/mimetypes/${type}/` });
  const xml = urlsetXml(urls);
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

