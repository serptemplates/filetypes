#!/usr/bin/env node
// Fetch MultimediaWiki pages via MediaWiki API and inject markdown into scripts/data/codecs.json

import fs from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SEED_FILE = path.resolve('scripts', 'data', 'codecs.json');
const MAP_FILE = path.join(ROOT, 'data', 'codec-wiki.json');
const API = 'https://wiki.multimedia.cx/api.php';

if (!fs.existsSync(SEED_FILE)) {
  console.error('Missing seed file:', SEED_FILE);
  process.exit(1);
}
const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

async function fetchParseHtml(title) {
  const url = `${API}?action=parse&format=json&formatversion=2&prop=text&redirects=1&page=${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { 'user-agent': 'serp-filetypes/1.0 (+https://serp.co)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${title}`);
  const json = await res.json();
  const html = json?.parse?.text || '';
  return { html, apiUrl: url.replace(/&formatversion=2/, '') };
}

function cleanHtml(html) {
  // Lightweight cleanup to remove edit links/navboxes if present
  return String(html)
    .replace(/<table[^>]*class=\"infobox[^>]*>[\s\S]*?<\/table>/gi, '')
    .replace(/<span class=\"editsection\">[\s\S]*?<\/span>/gi, '')
    .replace(/<!--[^]*?-->/g, '');
}

async function run() {
  let updated = 0;
  for (const rec of seed) {
    const id = rec.id;
    const title = map[id];
    if (!title) continue;
    try {
      const { html, apiUrl } = await fetchParseHtml(title);
      const md = turndown.turndown(cleanHtml(html)).trim();
      if (md) {
        rec.content_md = md;
        const sources = Array.isArray(rec.sources) ? rec.sources : [];
        sources.push({ label: `MultimediaWiki: ${title}`, url: `https://wiki.multimedia.cx/index.php?title=${encodeURIComponent(title)}` });
        sources.push({ label: 'MediaWiki API parse', url: apiUrl });
        rec.sources = sources;
        updated++;
        console.log(`Fetched ${title} → ${id} (${md.length} chars)`);
      } else {
        console.warn(`Empty content for ${title}`);
      }
    } catch (e) {
      console.warn(`Fetch failed for ${title}: ${e?.message || e}`);
    }
  }
  fs.writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2));
  console.log(`Updated ${updated} codec records with wiki content → ${SEED_FILE}`);
}

run().catch(e => { console.error(e); process.exit(1); });

