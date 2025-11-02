import Link from 'next/link';
import { listContainers } from '@/lib/server/container-repo';
import { ChevronRight } from 'lucide-react';
import { hrefHome } from '@/lib/url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function MatrixIndexPage() {
  const containers = await listContainers();
  return (
    <main>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <a href={hrefHome()} className="text-gray-500 hover:text-gray-700">Home</a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Matrix</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Container ↔ Codec Matrix</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {containers.map(c => (
            <Link key={c.slug} href={`/matrix/${c.slug}/`} className="block bg-white border rounded p-4 hover:border-gray-300">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-500">{c.slug}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

