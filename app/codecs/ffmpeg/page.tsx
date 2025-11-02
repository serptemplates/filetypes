import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { hrefHome, hrefCodecsRoot } from '@/lib/url';
import { listCodecImplsWithFamilyDocs, countCodecImpls } from '@/lib/server/codec-impls-repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function FfmpegCatalogPage() {
  const [video, audio, subtitle, total] = await Promise.all([
    listCodecImplsWithFamilyDocs('video', 2000),
    listCodecImplsWithFamilyDocs('audio', 2000),
    listCodecImplsWithFamilyDocs('subtitle', 2000),
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
            <span className="text-gray-900 font-medium">FFmpeg</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">FFmpeg Implementations</h1>
        <p className="text-gray-600 mb-2">Total: {total}. These are implementation IDs from FFmpeg grouped by kind.</p>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-900 mb-6">
          <div className="font-semibold mb-1">Comparison metrics you may see</div>
          <ul className="list-disc pl-5 space-y-0.5">
            <li><code>psnr</code> — sum of squared quantization errors (avoid, low quality)</li>
            <li><code>bit</code> — number of bits needed for the block</li>
            <li><code>rd</code> — rate–distortion optimal, slow</li>
            <li><code>zero</code> — 0</li>
            <li><code>vsad</code> — sum of absolute vertical differences</li>
            <li><code>vsse</code> — sum of squared vertical differences</li>
            <li><code>nsse</code> — noise‑preserving sum of squared differences</li>
            <li><code>w53</code> — 5/3 wavelet (only used in Snow)</li>
            <li><code>w97</code> — 9/7 wavelet (only used in Snow)</li>
            <li><code>dctmax</code></li>
            <li><code>chroma</code></li>
          </ul>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Video ({video.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {video.map((c) => (
              <div key={c.impl_id} className="bg-white border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm">{c.impl_id}</div>
                  <div className="text-xs text-gray-500">{c.decoder ? 'D' : ''}{c.encoder ? 'E' : ''}</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{buildSummary(c)}</div>
                {c.family_id && (
                  <div className="text-[11px] text-gray-500 mt-1">family: <Link href={`/codecs/${c.family_id}/`} className="hover:underline"><code>{c.family_id}</code></Link></div>
                )}
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
                  <div className="font-mono text-sm">{c.impl_id}</div>
                  <div className="text-xs text-gray-500">{c.decoder ? 'D' : ''}{c.encoder ? 'E' : ''}</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{buildSummary(c)}</div>
                {c.family_id && (
                  <div className="text-[11px] text-gray-500 mt-1">family: <Link href={`/codecs/${c.family_id}/`} className="hover:underline"><code>{c.family_id}</code></Link></div>
                )}
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
                  <div className="font-mono text-sm">{c.impl_id}</div>
                  <div className="text-xs text-gray-500">{c.decoder ? 'D' : ''}{c.encoder ? 'E' : ''}</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{buildSummary(c)}</div>
                {c.family_id && (
                  <div className="text-[11px] text-gray-500 mt-1">family: <Link href={`/codecs/${c.family_id}/`} className="hover:underline"><code>{c.family_id}</code></Link></div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function oneLine(s: string): string {
  if (!s) return '';
  const nl = s.indexOf('\n');
  const end = s.indexOf('.');
  let idx = -1;
  if (end !== -1 && nl !== -1) idx = Math.min(end + 1, nl);
  else if (end !== -1) idx = end + 1;
  else if (nl !== -1) idx = nl;
  const cut = idx !== -1 ? s.slice(0, idx) : s;
  return cut.length > 220 ? cut.slice(0, 217) + '...' : cut;
}

function guessKindById(id: string, defaultKind: string): string {
  const s = (id || '').toLowerCase();
  const audioPrefixes = [
    'adpcm_', 'pcm_', 'mp3', 'aac', 'ac3', 'eac3', 'truehd', 'dts', 'flac', 'vorbis', 'opus', 'alac', 'amr', 'g711', 'g722', 'g726', 'g729', 'speex', 'silk', 'wma', 'wmav', 'wavpack', 'ape', 'tta'
  ];
  const subPrefixes = [
    'subrip', 'webvtt', 'ass', 'ssa', 'mov_text', 'dvb_subtitle', 'hdmv_pgs_subtitle', 'pgs', 'xsub', 'microdvd', 'eia_608', 'eia_708', 'cea_608', 'cea_708', 'srt', 'vtt'
  ];
  if (audioPrefixes.some(p => s.startsWith(p))) return 'audio';
  if (subPrefixes.some(p => s.startsWith(p))) return 'subtitle';
  return defaultKind || 'video';
}

function shortDescForImpl(id: string, kind: string): string {
  const s = (id || '').toLowerCase();
  if (s.startsWith('adpcm_')) return 'Adaptive Differential PCM (ADPCM) audio codec';
  if (s.startsWith('pcm_')) return 'Raw PCM audio codec';
  if (s === 'g711' || s.startsWith('pcm_mulaw') || s.startsWith('pcm_alaw')) return 'G.711 telephony audio (PCMU/PCMA)';
  if (s.startsWith('g722')) return 'G.722 wideband ADPCM audio';
  if (s.startsWith('g726')) return 'G.726 ADPCM audio';
  if (s.startsWith('mp3')) return 'MPEG Layer III audio';
  if (s.startsWith('aac')) return 'Advanced Audio Coding (AAC)';
  if (s.startsWith('ac3')) return 'Dolby Digital (AC‑3) audio';
  if (s.startsWith('eac3')) return 'Dolby Digital Plus (E‑AC‑3) audio';
  if (s.startsWith('dts')) return 'DTS multi‑channel audio';
  if (s.startsWith('flac')) return 'Free Lossless Audio Codec (FLAC)';
  if (s.startsWith('alac')) return 'Apple Lossless (ALAC) audio';
  if (s.startsWith('amr')) return 'AMR‑NB/WB speech codec';
  if (s.startsWith('speex')) return 'Speex speech codec';
  if (s.startsWith('silk')) return 'SILK speech codec';
  if (s.startsWith('vorbis')) return 'Vorbis audio codec';
  if (s.startsWith('opus')) return 'Opus low‑latency audio codec';
  if (s.startsWith('wma') || s.startsWith('wmav')) return 'Windows Media Audio';
  const gk = guessKindById(s, kind);
  return `FFmpeg ${gk} implementation`;
}

function buildSummary(c: any): string {
  // Prefer FFmpeg long_name (desc) after update; then doc snippet
  if (c.desc) return oneLine(c.desc);
  const doc = oneLine(c.doc_md || '');
  if (doc) return doc;
  return shortDescForImpl(c.impl_id, c.kind);
}
