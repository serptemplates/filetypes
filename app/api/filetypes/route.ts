import { NextResponse } from 'next/server';
import { listFileTypes, countFileTypes, listFileTypesByCategory } from '@/lib/server/filetypes-repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const category = url.searchParams.get('category') || undefined;
  try {
    const safeLimit = isNaN(limit) ? 100 : limit;
    const safeOffset = isNaN(offset) ? 0 : offset;
    const rows = category
      ? await listFileTypesByCategory(category, safeLimit, safeOffset)
      : await listFileTypes(safeLimit, safeOffset);
    const total = await countFileTypes();
    return NextResponse.json({ items: rows, limit: safeLimit, offset: safeOffset, total }, { headers: { 'cache-control': 'public, max-age=60' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
