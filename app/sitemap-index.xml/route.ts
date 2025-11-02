import { NextRequest, NextResponse } from 'next/server';
import { originFor, sitemapIndexXml } from '@/app/sitemaps/_helpers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const origin = originFor(req);
  const now = new Date().toISOString();
  const items = [
    { loc: `${origin}/pages-sitemap.xml`, lastmod: now },
    { loc: `${origin}/filetypes-sitemap.xml`, lastmod: now },
    { loc: `${origin}/mimetypes-sitemap.xml`, lastmod: now },
    { loc: `${origin}/codecs-sitemap.xml`, lastmod: now },
    { loc: `${origin}/categories-sitemap.xml`, lastmod: now },
  ];
  const xml = sitemapIndexXml(items);
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

