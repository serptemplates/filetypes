import { NextRequest, NextResponse } from 'next/server';
import { originFor, urlsetXml } from '@/app/sitemaps/_helpers';
import { listFileTypes, countFileTypes } from '@/lib/server/filetypes-repo';

export const runtime = 'nodejs';

const PER_PAGE = 5000;

export async function GET(req: NextRequest, { params }: { params: Promise<{ page: string }> }) {
  const origin = originFor(req);
  const { page } = await params;
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const total = await countFileTypes();
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (pageNum > pages) return new NextResponse('Not Found', { status: 404 });
  const offset = (pageNum - 1) * PER_PAGE;
  const rows = await listFileTypes(PER_PAGE, offset);
  const urls = rows.map((r: any) => ({ loc: `${origin}/filetypes/${r.slug || r.extension}/` }));
  const xml = urlsetXml(urls);
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

