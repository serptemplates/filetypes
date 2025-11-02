import { NextResponse } from 'next/server';
import { getContainer } from '@/lib/server/container-repo';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rec = await getContainer(slug);
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rec);
}

