import Link from 'next/link';
import { listCodecs } from '@/lib/server/codec-repo';
import { countCodecImpls } from '@/lib/server/codec-impls-repo';
import { ChevronRight } from 'lucide-react';
import { hrefHome, hrefCodecsRoot, hrefCodec } from '@/lib/url';

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
    <main>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <a href={hrefHome()} className="text-gray-500 hover:text-gray-700">Home</a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href={hrefCodecsRoot()} className="text-gray-900 font-medium">Codecs</Link>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Codecs</h1>
      <p className="text-gray-600 mb-6">
        Core delivery codecs for web media (video/audio). Click to see details, containers, and references.
        <span className="ml-2 text-gray-500">FFmpeg implementations catalog: {implCount}</span>
      </p>
      {kinds.map(kind => (
        <section key={kind} className="mb-8">
          <h2 className="text-xl font-semibold mb-3 capitalize">{kind}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups[kind].map(c => (
              <Link key={c.id} href={hrefCodec(c.id)} className="block bg-white border rounded p-4 hover:border-gray-300">
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
      </div>
    </main>
  );
}
