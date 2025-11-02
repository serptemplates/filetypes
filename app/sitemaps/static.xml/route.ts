import { NextRequest, NextResponse } from 'next/server';
import { originFor, urlsetXml } from '@/app/sitemaps/_helpers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const origin = originFor(req);
  const now = new Date().toISOString();
  const urls = [
    { loc: `${origin}/`, lastmod: now, changefreq: 'daily', priority: '1.0' },
    { loc: `${origin}/codecs/`, lastmod: now },
    { loc: `${origin}/codecs/ffmpeg/`, lastmod: now },
    { loc: `${origin}/mimetypes/`, lastmod: now },
    { loc: `${origin}/categories/`, lastmod: now },
  ];
  const xml = urlsetXml(urls);
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

