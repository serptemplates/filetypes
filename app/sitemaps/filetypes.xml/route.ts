import { NextRequest, NextResponse } from 'next/server';
import { originFor, sitemapIndexXml } from '@/app/sitemaps/_helpers';
import { countFileTypes } from '@/lib/server/filetypes-repo';

export const runtime = 'nodejs';

const PER_PAGE = 5000;

export async function GET(req: NextRequest) {
  const origin = originFor(req);
  const total = await countFileTypes();
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const now = new Date().toISOString();
  const items = Array.from({ length: pages }, (_, i) => ({ loc: `${origin}/sitemaps/filetypes/${i + 1}.xml`, lastmod: now }));
  const xml = sitemapIndexXml(items);
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

