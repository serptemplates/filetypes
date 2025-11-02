import { NextRequest, NextResponse } from 'next/server';
import { originFor, sitemapIndexXml } from '@/app/sitemaps/_helpers';
import { countFileTypes } from '@/lib/server/filetypes-repo';

export const runtime = 'nodejs';

const FILETYPES_PER_PAGE = 5000;

export async function GET(req: NextRequest) {
  const origin = originFor(req);
  const filetypesTotal = await countFileTypes();
  const now = new Date().toISOString();
  const items: Array<{ loc: string; lastmod?: string }> = [];
  items.push({ loc: `${origin}/sitemaps/static.xml`, lastmod: now });
  // Point to sub-indexes for each section to keep top-level concise
  items.push({ loc: `${origin}/sitemaps/filetypes.xml`, lastmod: now });
  items.push({ loc: `${origin}/sitemaps/mimetypes.xml`, lastmod: now });
  items.push({ loc: `${origin}/sitemaps/codecs.xml`, lastmod: now });
  const xml = sitemapIndexXml(items);
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
