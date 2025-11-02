import { NextResponse } from 'next/server';
import { listCodecs } from '@/lib/server/codec-repo';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind') || undefined;
  const limit = Number(searchParams.get('limit') || '200');
  const items = await listCodecs(kind, limit);
  return NextResponse.json({ items, count: items.length });
}

