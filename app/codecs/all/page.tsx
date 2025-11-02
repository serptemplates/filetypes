import { listCodecImplsWithFamily, countCodecImpls } from '@/lib/server/codec-impls-repo';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { hrefHome, hrefCodecsRoot } from '@/lib/url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AllCodecsPage() {
  const [video, audio, subtitle, total] = await Promise.all([
    listCodecImplsWithFamily('video', 2000),
    listCodecImplsWithFamily('audio', 2000),
    listCodecImplsWithFamily('subtitle', 2000),
    countCodecImpls(),
  ]);
  return (
    <main>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <a href={hrefHome()} className="text-gray-500 hover:text-gray-700">Home</a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href={hrefCodecsRoot()} className="text-gray-500 hover:text-gray-700">Codecs</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">All</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">All FFmpeg Codecs</h1>
      <p className="text-gray-600 mb-6">Total: {total}. This list shows implementation IDs directly from FFmpeg.</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Video ({video.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {video.map((c) => (
            <div key={c.impl_id} className="bg-white border rounded p-3">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm flex items-center gap-2">
                  <Link href={`/codecs/impl/${c.impl_id}/`} className="text-blue-600 hover:underline">{c.impl_id}</Link>
                  {c.family_id && (
                    <Link href={`/codecs/${c.family_id}/`} className="text-xs text-gray-500 hover:underline">(family)</Link>
                  )}
                </div>
                <div className="text-xs text-gray-500">{c.decoder ? 'D' : ''}{c.encoder ? 'E' : ''}</div>
              </div>
              {c.desc && <div className="text-xs text-gray-600 mt-1">{c.desc}</div>}
              {c.family_id && <div className="text-[11px] text-gray-500 mt-1">family: <code>{c.family_id}</code></div>}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Audio ({audio.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {audio.map((c) => (
            <div key={c.impl_id} className="bg-white border rounded p-3">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm flex items-center gap-2">
                  <Link href={`/codecs/impl/${c.impl_id}/`} className="text-blue-600 hover:underline">{c.impl_id}</Link>
                  {c.family_id && (
                    <Link href={`/codecs/${c.family_id}/`} className="text-xs text-gray-500 hover:underline">(family)</Link>
                  )}
                </div>
                <div className="text-xs text-gray-500">{c.decoder ? 'D' : ''}{c.encoder ? 'E' : ''}</div>
              </div>
              {c.desc && <div className="text-xs text-gray-600 mt-1">{c.desc}</div>}
              {c.family_id && <div className="text-[11px] text-gray-500 mt-1">family: <code>{c.family_id}</code></div>}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Subtitles ({subtitle.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {subtitle.map((c) => (
            <div key={c.impl_id} className="bg-white border rounded p-3">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm flex items-center gap-2">
                  <Link href={`/codecs/impl/${c.impl_id}/`} className="text-blue-600 hover:underline">{c.impl_id}</Link>
                  {c.family_id && (
                    <Link href={`/codecs/${c.family_id}/`} className="text-xs text-gray-500 hover:underline">(family)</Link>
                  )}
                </div>
                <div className="text-xs text-gray-500">{c.decoder ? 'D' : ''}{c.encoder ? 'E' : ''}</div>
              </div>
              {c.desc && <div className="text-xs text-gray-600 mt-1">{c.desc}</div>}
              {c.family_id && <div className="text-[11px] text-gray-500 mt-1">family: <code>{c.family_id}</code></div>}
            </div>
          ))}
        </div>
      </section>

      <div className="text-sm text-gray-600">
        <Link href={hrefCodecsRoot()} className="text-blue-600 hover:underline">Back to curated codecs</Link>
      </div>
      </div>
    </main>
  );
}
