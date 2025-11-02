#!/usr/bin/env node
// Parse the ffmpeg-codecs.html page to extract the full -codecs table

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out-ffmpeg');
fs.mkdirSync(OUT, { recursive: true });

const DOC_URL = 'https://ffmpeg.org/ffmpeg-codecs.html';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'serp-filetypes/1.0 (+https://serp.co)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function htmlToText(html) {
  // crude but effective: strip tags and decode a few entities
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r/g, '')
    .replace(/\n\n+/g, '\n')
    .trim();
}

function parseTable(text) {
  const lines = text.split(/\n/);
  const recs = [];
  const re = /^\s*([ D\.])([ E\.])([VASD\.])([I\.])([L\.])([S\.])\s+(\S+)\s+(.+)$/;
  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const [, dFlag, eFlag, tFlag] = m;
    const id = m[7];
    const desc = m[8].trim();
    let kind = 'other';
    if (tFlag === 'V') kind = 'video';
    else if (tFlag === 'A') kind = 'audio';
    else if (tFlag === 'S') kind = 'subtitle';
    else if (tFlag === 'D') kind = 'data';
    const decoder = dFlag === 'D';
    const encoder = eFlag === 'E';
    recs.push({ id, kind, decoder, encoder, desc });
  }
  // Deduplicate by id; merge flags
  const map = new Map();
  for (const r of recs) {
    const prev = map.get(r.id) || { id: r.id, kinds: new Set(), decoder: false, encoder: false, desc: r.desc };
    prev.kinds.add(r.kind);
    prev.decoder = prev.decoder || r.decoder;
    prev.encoder = prev.encoder || r.encoder;
    if (!prev.desc && r.desc) prev.desc = r.desc;
    map.set(r.id, prev);
  }
  return Array.from(map.values()).map(r => ({ id: r.id, kinds: Array.from(r.kinds), decoder: r.decoder, encoder: r.encoder, desc: r.desc }));
}

async function run() {
  const html = await fetchText(DOC_URL);
  const text = htmlToText(html);
  const list = parseTable(text);
  list.sort((a,b)=>a.id.localeCompare(b.id));
  fs.writeFileSync(path.join(OUT, 'codecs-table.json'), JSON.stringify(list, null, 2));
  const byKind = list.reduce((acc, r) => { for (const k of r.kinds) acc[k]=(acc[k]||0)+1; return acc; }, {});
  console.log(`FFmpeg -codecs parsed: total ${list.length} | video=${byKind.video||0} audio=${byKind.audio||0} subtitle=${byKind.subtitle||0}`);
  console.log(`→ ${path.join(OUT, 'codecs-table.json')}`);
}

run().catch(e => { console.error(e); process.exit(1); });
