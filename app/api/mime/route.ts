import { NextResponse } from 'next/server';
import { listMimes } from '@/lib/server/mime-repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '2500', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const items = await listMimes(isNaN(limit) ? 2500 : limit, isNaN(offset) ? 0 : offset);
    return NextResponse.json({ items, limit, offset }, { headers: { 'cache-control': 'public, max-age=300' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to list MIME records' }, { status: 500 });
  }
}
