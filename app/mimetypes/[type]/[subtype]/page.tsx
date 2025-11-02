import { notFound, redirect } from 'next/navigation';
import { getMimeRecord } from '@/lib/server/mime-repo';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { displayNameForMime, canonicalizeMime } from '@/lib/mime-utils';
import { findCodecByIdentifier } from '@/lib/server/codec-repo';
import { hrefHome, hrefMimeType, hrefMimeRoot } from '@/lib/url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function MimePage({ params }: any) {
  const { type, subtype } = await params;
  // Normalize subtype: ensure '+' is preserved even if a space leaked in
  const normSubtype = String(subtype).replace(/\s+/g, '+');
  const canon = canonicalizeMime(String(type), normSubtype);
  if (canon && (canon.type !== type || canon.subtype !== normSubtype)) {
    redirect(`/mimetypes/${canon.type}/${encodeURIComponent(canon.subtype)}/`);
  }
  const rec = await getMimeRecord(type, normSubtype);
  if (!rec) notFound();
  let relatedCodec: any = null;
  if (rec.type === 'video' || rec.type === 'audio') {
    relatedCodec = await findCodecByIdentifier(rec.subtype);
  }
  return (
    <main>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <a href={hrefHome()} className="text-gray-500 hover:text-gray-700">Home</a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href={hrefMimeRoot()} className="text-gray-500 hover:text-gray-700">MIME Types</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href={hrefMimeType(type)} className="text-gray-500 hover:text-gray-700">{type}</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{normSubtype}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-1 flex items-center gap-3">
          <span>{displayNameForMime(rec.type, rec.subtype)}</span>
          {rec.iana?.template_url ? (
            <a href={rec.iana.template_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200">
              IANA Registered
            </a>
          ) : (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Vendor</span>
          )}
        </h1>
        <div className="text-sm text-gray-600 mb-4">MIME: {rec.full}</div>
        <div className="text-sm text-gray-600 mb-4">Extensions: {(rec.extensions || []).map((e: string) => `.${e}`).join(', ') || '—'}</div>
        {relatedCodec && (
          <div className="mb-4 text-sm">
            Related codec: <Link href={`/codecs/${relatedCodec.id}/`} className="text-blue-600 hover:underline">{relatedCodec.name}</Link>
          </div>
        )}
        <pre className="bg-white rounded border p-4 overflow-auto text-sm">{JSON.stringify(rec.iana ? { ...rec, iana: { ...rec.iana, template_text: rec.iana.template_text ? '[omitted]' : undefined } } : rec, null, 2)}</pre>
      </div>
    </main>
  );
}
