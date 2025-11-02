import { notFound } from 'next/navigation';
import { getRfc } from '@/lib/server/references-repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function RfcPage({ params }: any) {
  const { id } = await params;
  const rec = await getRfc(id);
  if (!rec) return notFound();
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">{rec.title || `RFC ${id}`}</h1>
      <p className="text-sm text-gray-600 mb-6">
        Source: <a className="text-blue-600 hover:underline" href={`https://www.rfc-editor.org/rfc/rfc${id}.html`} target="_blank" rel="noopener noreferrer">RFC Editor</a>.
        Content may be subject to the IETF Trust copyright and license; refer to the RFC Editor site for the canonical document.
      </p>
      <pre className="bg-white rounded-lg shadow-sm p-4 overflow-auto text-sm leading-5 whitespace-pre-wrap">
        {rec.body}
      </pre>
    </main>
  );
}
