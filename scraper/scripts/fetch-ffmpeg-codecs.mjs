#!/usr/bin/env node
// Fetch FFmpeg codec lists (encoders/decoders) from upstream texi docs
// and build a normalized list of codec ids with kind and roles.

import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'out-ffmpeg');
fs.mkdirSync(OUT_DIR, { recursive: true });

const URLS = {
  decoders: 'https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/doc/decoders.texi',
  encoders: 'https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/doc/encoders.texi',
};

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'serp-filetypes/1.0 (+https://serp.co)' } });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  return await res.text();
}

function stripTexi(s) {
  return s
    .replace(/@code\{([^}]*)\}/g, '$1')
    .replace(/@url\{([^}]*)\}/g, '$1')
    .replace(/@emph\{([^}]*)\}/g, '$1')
    .replace(/@xref\{([^}]*)\}/g, '$1')
    .replace(/@\w+\{([^}]*)\}/g, '$1')
    .replace(/@\w+/g, '')
    .replace(/\{\}/g, '')
    .trim();
}

function parseTexi(text, role) {
  const lines = text.split(/\r?\n/);
  let kind = null; // 'video' | 'audio' | 'subtitle' | 'image'
  const records = [];
  let cur = null;

  const commit = () => {
    if (cur) {
      cur.desc = stripTexi(cur.desc.join('\n')).replace(/\n\n+/g, '\n').trim();
      records.push(cur);
      cur = null;
    }
  };

  for (let raw of lines) {
    const line = raw.trimEnd();
    const ch = line.match(/^@chapter\s+(.+)$/i);
    if (ch) {
      commit();
      const t = ch[1].toLowerCase();
      if (t.includes('video')) kind = 'video';
      else if (t.includes('audio')) kind = 'audio';
      else if (t.includes('subtitle')) kind = 'subtitle';
      else if (t.includes('image')) kind = 'image';
      else kind = null;
      continue;
    }
    const sec = line.match(/^@section\s+([\w\-\.\+]+)\s*$/);
    if (sec) {
      commit();
      const id = sec[1];
      cur = { id, kind, role, desc: [] };
      continue;
    }
    if (cur) {
      // Stop capturing on next major directive
      if (/^@section\b|^@chapter\b|^@c\b/.test(line)) { commit(); continue; }
      cur.desc.push(line);
    }
  }
  commit();
  return records.filter(r => r.id && r.kind);
}

function mergeRoles(decoders, encoders) {
  const map = new Map();
  const put = (r) => {
    const key = r.id.toLowerCase();
    const prev = map.get(key) || { id: key, kinds: new Set(), encoder: false, decoder: false, descs: [] };
    prev.kinds.add(r.kind);
    prev[r.role === 'decoder' ? 'decoder' : 'encoder'] = true;
    if (r.desc) prev.descs.push(r.desc);
    map.set(key, prev);
  };
  decoders.forEach(put);
  encoders.forEach(put);
  const out = [];
  for (const v of map.values()) {
    out.push({
      id: v.id,
      kinds: Array.from(v.kinds),
      encoder: v.encoder,
      decoder: v.decoder,
      desc: (v.descs.find(Boolean) || '').split('\n').find(Boolean) || '',
    });
  }
  out.sort((a,b)=>a.id.localeCompare(b.id));
  return out;
}

async function run() {
  const [decText, encText] = await Promise.all([
    fetchText(URLS.decoders),
    fetchText(URLS.encoders),
  ]);
  const dec = parseTexi(decText, 'decoder');
  const enc = parseTexi(encText, 'encoder');
  const merged = mergeRoles(dec, enc);
  fs.writeFileSync(path.join(OUT_DIR, 'codecs.json'), JSON.stringify(merged, null, 2));
  const byKind = merged.reduce((acc, r) => { for (const k of r.kinds) acc[k]=(acc[k]||0)+1; return acc; }, {});
  console.log(`FFmpeg codecs: total ${merged.length} | video=${byKind.video||0} audio=${byKind.audio||0} subtitle=${byKind.subtitle||0} image=${byKind.image||0}`);
  console.log(`→ ${path.join(OUT_DIR, 'codecs.json')}`);
}

run().catch(e => { console.error(e); process.exit(1); });

