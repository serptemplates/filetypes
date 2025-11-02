import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getContainer } from '@/lib/server/container-repo';
import { hrefHome, hrefCodec } from '@/lib/url';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function MatrixContainerPage({ params }: any) {
  const { slug } = await params;
  const rec = await getContainer(slug);
  if (!rec) return notFound();
  const kinds: Array<'video'|'audio'|'subtitle'> = ['video','audio','subtitle'];
  return (
    <main>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <a href={hrefHome()} className="text-gray-500 hover:text-gray-700">Home</a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href="/matrix/" className="text-gray-500 hover:text-gray-700">Matrix</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{rec.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">{rec.name}</h1>
        {rec.links && rec.links.length > 0 && (
          <div className="mb-4 text-sm">{rec.links.map((l,i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mr-3">{l.label || l.url}</a>
          ))}</div>
        )}
        {kinds.map(kind => (
          <section key={kind} className="mb-6">
            <h2 className="font-semibold capitalize mb-2">{kind}</h2>
            <div className="flex flex-wrap gap-2">
              {(rec.codecs?.[kind] || []).map(cid => (
                <Link key={cid} href={hrefCodec(cid)} className="px-2 py-1 bg-white border rounded text-sm hover:border-gray-300">
                  {cid}
                </Link>
              ))}
              {(!rec.codecs?.[kind] || rec.codecs?.[kind]?.length === 0) && (
                <span className="text-sm text-gray-500">—</span>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

