import { NextRequest } from 'next/server';

export function originFor(req: NextRequest): string {
  try {
    const url = new URL(req.url);
    return url.origin;
  } catch {
    return '';
  }
}

export function xmlHeader(): string {
  return '<?xml version="1.0" encoding="UTF-8"?>';
}

export function sitemapIndexXml(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
  const body = sitemaps
    .map(s => `  <sitemap>\n    <loc>${escapeXml(s.loc)}</loc>${s.lastmod ? `\n    <lastmod>${s.lastmod}</lastmod>` : ''}\n  </sitemap>`) 
    .join('\n');
  return `${xmlHeader()}\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

export function urlsetXml(urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }>): string {
  const body = urls
    .map(u => {
      const parts = [`    <loc>${escapeXml(u.loc)}</loc>`];
      if (u.lastmod) parts.push(`    <lastmod>${u.lastmod}</lastmod>`);
      if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
      if (u.priority) parts.push(`    <priority>${u.priority}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');
  return `${xmlHeader()}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\'/g, '&apos;');
}

