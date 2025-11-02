#!/usr/bin/env node
// Fetch FFmpeg codec_desc.c and extract name -> long_name map

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out-ffmpeg');
fs.mkdirSync(OUT, { recursive: true });

const URL = 'https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavcodec/codec_desc.c';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'serp-filetypes/1.0 (+https://serp.co)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function parse(text) {
  const lines = text.split(/\r?\n/);
  const out = {};
  let current = null;
  for (let i=0;i<lines.length;i++) {
    const line = lines[i].trim();
    if (line === '{') { current = { name: null, long_name: null, type: null }; continue; }
    if (line === '},' || line === '}') { if (current && current.name) out[current.name] = current; current = null; continue; }
    if (!current) continue;
    const nm = line.match(/\.name\s*=\s*\"([^\"]+)\"/);
    if (nm) { current.name = nm[1]; continue; }
    const ln = line.match(/\.long_name\s*=\s*NULL_IF_CONFIG_SMALL\(\"([^\"]+)\"\)/);
    if (ln) { current.long_name = ln[1]; continue; }
    const tp = line.match(/\.type\s*=\s*AVMEDIA_TYPE_([A-Z]+)/);
    if (tp) { current.type = tp[1].toLowerCase(); continue; }
  }
  return out;
}

async function run() {
  const text = await fetchText(URL);
  const map = parse(text);
  const simplified = Object.fromEntries(Object.entries(map).map(([k,v]) => [k, { long_name: v.long_name || '', type: v.type || '' }]));
  fs.writeFileSync(path.join(OUT, 'codec-desc.json'), JSON.stringify(simplified, null, 2));
  console.log(`Wrote ${Object.keys(simplified).length} codec descriptions → ${path.join(OUT, 'codec-desc.json')}`);
}

run().catch(e => { console.error(e); process.exit(1); });
