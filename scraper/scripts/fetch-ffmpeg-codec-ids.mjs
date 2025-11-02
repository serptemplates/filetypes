#!/usr/bin/env node
// Fetch FFmpeg libavcodec/codec_id.h and parse AVCodecID enum into a master list

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const URL = 'https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavcodec/codec_id.h';
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out-ffmpeg');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'serp-filetypes/1.0 (+https://serp.co)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function normalizeId(avId) {
  // AV_CODEC_ID_H264 -> h264 ; AV_CODEC_ID_MPEG2VIDEO -> mpeg2video
  return String(avId).replace(/^AV_CODEC_ID_/, '').toLowerCase();
}

function runParse(text) {
  const lines = text.split(/\r?\n/);
  let kind = 'other';
  const items = [];
  const aliases = [];
  for (let raw of lines) {
    const line = raw.trim();
    if (/\/\*\s*video codecs\s*\*\//i.test(line)) { kind = 'video'; continue; }
    if (/\/\*\s*audio codecs\s*\*\//i.test(line)) { kind = 'audio'; continue; }
    if (/\/\*\s*subtitle codecs\s*\*\//i.test(line)) { kind = 'subtitle'; continue; }
    if (/\/\*\s*various PCM codecs\s*\*\//i.test(line)) { kind = 'audio'; continue; }
    if (/\/\*\s*ADPCM codecs\s*\*\//i.test(line)) { kind = 'audio'; continue; }
    if (/\/\*\s*other codecs\s*\*\//i.test(line)) { kind = 'other'; continue; }

    const m = line.match(/^AV_CODEC_ID_([A-Z0-9_]+)\s*(?:=|,)/);
    if (m) {
      const avId = `AV_CODEC_ID_${m[1]}`;
      const id = normalizeId(avId);
      items.push({ av_id: avId, id, kind });
      continue;
    }
    // Aliases via #define
    const def = line.match(/^#define\s+(AV_CODEC_ID_[A-Z0-9_]+)\s+(AV_CODEC_ID_[A-Z0-9_]+)/);
    if (def) {
      const alias = def[1];
      const target = def[2];
      aliases.push({ alias, target });
    }
  }
  // Attach aliases
  const kindByAv = Object.fromEntries(items.map(x => [x.av_id, x.kind]));
  for (const a of aliases) {
    const k = kindByAv[a.target] || 'other';
    items.push({ av_id: a.alias, id: normalizeId(a.alias), kind: k, alias_of: a.target });
  }
  // Deduplicate by av_id
  const map = new Map();
  for (const it of items) map.set(it.av_id, it);
  return Array.from(map.values());
}

async function run() {
  const text = await fetchText(URL);
  const list = runParse(text);
  list.sort((a,b)=>a.id.localeCompare(b.id));
  fs.writeFileSync(path.join(OUT_DIR, 'codec-ids.json'), JSON.stringify(list, null, 2));
  const byKind = list.reduce((acc, r) => { acc[r.kind]=(acc[r.kind]||0)+1; return acc; }, {});
  console.log(`FFmpeg AVCodecID: total ${list.length} | video=${byKind.video||0} audio=${byKind.audio||0} subtitle=${byKind.subtitle||0} other=${byKind.other||0}`);
  console.log(`→ ${path.join(OUT_DIR, 'codec-ids.json')}`);
}

run().catch(e => { console.error(e); process.exit(1); });
