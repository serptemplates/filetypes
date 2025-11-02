import { NextResponse } from 'next/server';
import { getFileTypeRaw } from '@/lib/server/filetypes-repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: Request, context: any) {
  const { slug } = context.params ?? {};
  try {
    const rec = await getFileTypeRaw(slug);
    if (!rec) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(rec, { headers: { 'cache-control': 'public, max-age=60' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
