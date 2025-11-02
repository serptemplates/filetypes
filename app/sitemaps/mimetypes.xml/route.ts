import { NextRequest, NextResponse } from 'next/server';
import { originFor, sitemapIndexXml } from '@/app/sitemaps/_helpers';
import { getDb } from '@/lib/server/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const origin = originFor(req);
  const db = await getDb();
  const typesRes = db.exec('SELECT DISTINCT type FROM mimes ORDER BY type')[0];
  const now = new Date().toISOString();
  const items = (typesRes?.values || []).map((row: any[]) => {
    const type = String(row[typesRes.columns.indexOf('type')]);
    return { loc: `${origin}/sitemaps/mimetypes/${type}.xml`, lastmod: now };
  });
  const xml = sitemapIndexXml(items);
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
