import { NextResponse } from 'next/server';
import { listContainers } from '@/lib/server/container-repo';

export const runtime = 'nodejs';

export async function GET() {
  const items = await listContainers();
  return NextResponse.json({ items, count: items.length });
}

