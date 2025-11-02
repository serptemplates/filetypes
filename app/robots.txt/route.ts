import { NextRequest, NextResponse } from 'next/server';
import { originFor } from '@/app/sitemaps/_helpers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const origin = originFor(req);
  const body = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap-index.xml
`;
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

