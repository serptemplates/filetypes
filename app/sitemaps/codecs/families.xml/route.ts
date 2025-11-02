import { NextRequest, NextResponse } from 'next/server';
import { originFor, urlsetXml } from '@/app/sitemaps/_helpers';
import { listCodecs } from '@/lib/server/codec-repo';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const origin = originFor(req);
  const families = await listCodecs(undefined, 2000);
  const urls = families.map(c => ({ loc: `${origin}/codecs/${c.id}/` }));
  urls.push({ loc: `${origin}/codecs/` });
  urls.push({ loc: `${origin}/codecs/ffmpeg/` });
  const xml = urlsetXml(urls);
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

