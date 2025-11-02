import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCodec } from '@/lib/server/codec-repo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }: any) {
  const { id } = await params;
  const rec = await getCodec(id);
  if (!rec) return { title: 'Codec not found' };
  return { title: `${rec.name} (${rec.id})` };
}

export default async function CodecPage({ params }: any) {
  const { id } = await params;
  const rec = await getCodec(id);
  if (!rec) return notFound();
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{rec.name}</h1>
      <div className="text-sm text-gray-600 mb-4">ID: <code>{rec.id}</code>{rec.year ? ` • ${rec.year}` : ''} • Kind: {rec.kind}</div>
      {rec.summary && <p className="mb-6 text-gray-800">{rec.summary}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Typical Containers</h2>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {(rec.containers || []).map(c => (
              <li key={c}><span className="font-mono">{c}</span></li>
            ))}
            {(!rec.containers || rec.containers.length === 0) && <li className="text-gray-500">—</li>}
          </ul>
        </div>

        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Typical MIME Types</h2>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {(rec.mimes || []).map(m => (
              <li key={m}><span className="font-mono">{m}</span></li>
            ))}
            {(!rec.mimes || rec.mimes.length === 0) && <li className="text-gray-500">—</li>}
          </ul>
        </div>
      </div>

      <div className="bg-white border rounded p-4 mt-6">
        <h2 className="font-semibold mb-2">Aliases</h2>
        <div className="text-sm text-gray-700">{(rec.aliases || []).join(', ') || '—'}</div>
      </div>

      {rec.content_md && (
        <div className="bg-white border rounded p-4 mt-6">
          <h2 className="font-semibold mb-2">Overview</h2>
          <article className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{rec.content_md}</ReactMarkdown>
          </article>
        </div>
      )}

      {rec.sources && rec.sources.length > 0 && (
        <div className="bg-white border rounded p-4 mt-6">
          <h2 className="font-semibold mb-2">Sources</h2>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {rec.sources.map((s, i) => (
              <li key={i}><a className="text-blue-600 hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.label || s.url}</a></li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 text-sm">
        {rec.spec_url && (
          <a href={rec.spec_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Specification / reference</a>
        )}
        <span className="ml-3 text-gray-500">
          <Link href="/codecs/" className="hover:underline">Back to codecs</Link>
        </span>
      </div>
    </main>
  );
}

