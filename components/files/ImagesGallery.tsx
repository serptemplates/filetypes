import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface Img {
  url: string;
  alt?: string;
  caption?: string;
}

function isHttpUrl(url?: string) {
  return !!url && /^https?:\/\//i.test(url);
}

function isLikelyLogoOrJunk(img: Img) {
  const u = img.url || '';
  const alt = (img.alt || '').toLowerCase();
  if (!u || u.startsWith('data:')) return true; // drop embedded base64 icons
  if (!isHttpUrl(u)) return true; // only hotlink http(s)
  if (alt.includes('logo')) return true; // drop obvious logos
  // drop common logo filename patterns
  const lower = u.toLowerCase();
  if (lower.includes('logo')) return true;
  return false;
}

function isGenericLabel(text?: string) {
  if (!text) return true;
  const t = text.trim().toLowerCase();
  if (!t) return true;
  // Common low-value captions/alts
  const generic = ['screenshot', 'image', 'photo', 'random', 'logo', 'icon'];
  if (generic.includes(t)) return true;
  // Very short generic words
  if (t.length <= 3) return true;
  return false;
}

export default function ImagesGallery({ images, screenshotUrl }: { images?: Img[]; screenshotUrl?: string }) {
  const seen = new Set<string>();
  const curated: Img[] = [];

  // Prefer a primary screenshot only if it has a non-generic label (we set alt ourselves, so skip by default)
  // if (isHttpUrl(screenshotUrl)) { ... }

  for (const img of images || []) {
    if (!img || isLikelyLogoOrJunk(img)) continue;
    const label = img.caption || img.alt;
    if (seen.has(img.url)) continue;
    if (isGenericLabel(label)) continue;
    seen.add(img.url);
    curated.push(img);
    if (curated.length >= 6) break;
  }

  // Hide the entire section unless we have at least two curated, non-generic images
  if (curated.length < 2) return null;

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
        Images
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {curated.map((img, idx) => (
          <figure key={idx} className="bg-gray-50 rounded border border-gray-200 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt || ''} className="w-full h-28 object-contain" />
            {(!isGenericLabel(img.caption) || !isGenericLabel(img.alt)) && (
              <figcaption className="mt-1 text-xs text-gray-600 line-clamp-2">{img.caption || img.alt}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
