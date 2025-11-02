import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { listMimesByType } from '@/lib/server/mime-repo';
import { hrefHome, hrefMimeType, hrefMimeSubtype, hrefMimeRoot } from '@/lib/url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function MimeTypeIndexPage({ params }: any) {
  const { type } = await params;
  const data = await listMimesByType(type);
  if (!data.subtypes.length) return notFound();

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
            <span className="text-gray-900 font-medium">{type}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">{type} media types</h1>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.subtypes.map((s) => (
            <li key={s} className="bg-white border rounded p-3 hover:border-gray-300">
              <Link href={hrefMimeSubtype(type, s)} className="text-blue-600 hover:underline">
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
