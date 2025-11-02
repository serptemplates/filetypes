import { NextResponse } from 'next/server';
import { getMimeRecord } from '@/lib/server/mime-repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: Request, context: any) {
  try {
    const { type, subtype } = context.params ?? {};
    const rec = await getMimeRecord(type, subtype);
    if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rec, { headers: { 'cache-control': 'public, max-age=600' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to read MIME record' }, { status: 500 });
  }
}
