import { NextResponse } from 'next/server';
import { listMimesByExtension } from '@/lib/server/mime-repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: Request, context: any) {
  try {
    const { ext } = context.params ?? {};
    const data = await listMimesByExtension(ext);
    return NextResponse.json(data, { headers: { 'cache-control': 'public, max-age=1200' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to read mapping' }, { status: 500 });
  }
}
