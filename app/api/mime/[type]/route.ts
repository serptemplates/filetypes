import { NextResponse } from 'next/server';
import { listMimesByType } from '@/lib/server/mime-repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: Request, context: any) {
  try {
    const { type } = await context.params;
    const data = await listMimesByType(type);
    if (!data.subtypes.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data, { headers: { 'cache-control': 'public, max-age=600' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to list MIME subtypes' }, { status: 500 });
  }
}

