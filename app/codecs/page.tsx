import Link from 'next/link';
import { listCodecs } from '@/lib/server/codec-repo';
import { countCodecImpls } from '@/lib/server/codec-impls-repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function CodecsIndexPage() {
  const [all, implCount] = await Promise.all([
    listCodecs(undefined, 500),
    countCodecImpls(),
  ]);
  const groups: Record<string, typeof all> = all.reduce((acc: any, c) => {
    acc[c.kind] = acc[c.kind] || [];
    acc[c.kind].push(c);
    return acc;
  }, {});
  const kinds = Object.keys(groups).sort();
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Codecs</h1>
      <p className="text-gray-600 mb-6">
        Core delivery codecs for web media (video/audio). Click to see details, containers, and references.
        <span className="ml-2">
          <Link href="/codecs/all/" className="text-blue-600 hover:underline">View all FFmpeg codecs</Link>
          <span className="text-gray-500"> ({implCount})</span>
        </span>
      </p>
      {kinds.map(kind => (
        <section key={kind} className="mb-8">
          <h2 className="text-xl font-semibold mb-3 capitalize">{kind}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups[kind].map(c => (
              <Link key={c.id} href={`/codecs/${c.id}/`} className="block bg-white border rounded p-4 hover:border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.id}{c.year ? ` • ${c.year}` : ''}</div>
                  </div>
                </div>
                {c.summary && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.summary}</p>}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
