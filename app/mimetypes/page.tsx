import Link from 'next/link';
import { listMimeTypesWithCounts } from '@/lib/server/mime-repo';
import { hrefHome, hrefMimeType } from '@/lib/url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function MimeTypesHome() {
  const types = await listMimeTypesWithCounts();
  return (
    <main>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <a href={hrefHome()} className="text-gray-500 hover:text-gray-700">Home</a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">MIME Types</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">MIME Types</h1>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {types.map(({ type, count }) => (
            <li key={type} className="bg-white border rounded p-3 hover:border-gray-300 flex items-center justify-between">
              <Link href={hrefMimeType(type)} className="text-blue-600 hover:underline">
                {type}
              </Link>
              <span className="text-xs text-gray-500">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
