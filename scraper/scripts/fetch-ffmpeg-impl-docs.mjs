#!/usr/bin/env node
// Extract FFmpeg decoder/encoder section docs from texi into Markdown-ish text

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'out-ffmpeg');
fs.mkdirSync(OUT, { recursive: true });

const URLS = {
  decoders: 'https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/doc/decoders.texi',
  encoders: 'https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/doc/encoders.texi',
};

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'serp-filetypes/1.0 (+https://serp.co)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function texiToMd(s) {
  return s
    .replace(/@code\{([^}]*)\}/g, '`$1`')
    .replace(/@url\{([^}]*)\}/g, '$1')
    .replace(/@emph\{([^}]*)\}/g, '*$1*')
    .replace(/@table\s+@option/g, '')
    .replace(/@item\s+/g, '- ')
    .replace(/@end\s+table/g, '')
    .replace(/@subsection\s+Options/g, '## Options')
    .replace(/@subsection\s+[^\n]+/g, (_, m) => `## ${m || ''}`)
    .replace(/@section\s+([^\n]+)/g, (_, m) => `# ${m}`)
    .replace(/@chapter[\s\S]*?\n/g, '')
    .replace(/@c\s.*$/gm, '')
    .replace(/@\w+\{([^}]*)\}/g, '$1')
    .replace(/@\w+/g, '')
    .trim();
}

function extractSections(text, role) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw;
    const sec = line.match(/^@section\s+([\w\-\.\+]+)/);
    if (sec) {
      if (cur) out.push(cur);
      cur = { id: sec[1], role, buf: [] };
      continue;
    }
    const directive = /^@(section|chapter)\b/.test(line);
    if (directive) { if (cur) { out.push(cur); cur = null; } continue; }
    if (cur) cur.buf.push(raw);
  }
  if (cur) out.push(cur);
  return out.map(s => ({ id: s.id, role: s.role, content: texiToMd(s.buf.join('\n')) })).filter(s => s.content && s.content.length > 50);
}

async function run() {
  const [dec, enc] = await Promise.all([
    fetchText(URLS.decoders),
    fetchText(URLS.encoders),
  ]);
  const decSections = extractSections(dec, 'decoder');
  const encSections = extractSections(enc, 'encoder');
  const all = [...decSections, ...encSections];
  fs.writeFileSync(path.join(OUT, 'impl-docs.json'), JSON.stringify(all, null, 2));
  console.log(`Extracted ${all.length} impl docs → ${path.join(OUT, 'impl-docs.json')}`);
}

run().catch(e => { console.error(e); process.exit(1); });

