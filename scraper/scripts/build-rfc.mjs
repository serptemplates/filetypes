#!/usr/bin/env node
// Build normalized RFC JSON from raw text files into scraper/out-references/rfc

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW = path.resolve(ROOT, 'raw', 'references', 'rfc');
const OUT = path.resolve(ROOT, 'out-references', 'rfc');
fs.mkdirSync(OUT, { recursive: true });

function parseRfcText(text) {
  const lines = text.split(/\r?\n/);
  const title = (lines.find(l => l && !/^\s/.test(l)) || '').trim();
  const abstractStart = lines.findIndex(l => /^\s*Abstract\s*$/i.test(l));
  let abstract = '';
  if (abstractStart >= 0) {
    let i = abstractStart + 1;
    const parts = [];
    while (i < lines.length && lines[i].trim() !== '') {
      parts.push(lines[i]);
      i++;
    }
    abstract = parts.join('\n').trim();
  }
  const numberMatch = text.match(/RFC\s*(\d{3,5})/i);
  const number = numberMatch ? numberMatch[1] : undefined;
  return { title, abstract, number };
}

const files = fs.existsSync(RAW) ? fs.readdirSync(RAW).filter(f => f.endsWith('.txt')) : [];
let count = 0;
for (const f of files) {
  const id = f.replace(/\.txt$/i, '');
  const txt = fs.readFileSync(path.join(RAW, f), 'utf8');
  const meta = parseRfcText(txt);
  const rec = {
    id,
    kind: 'RFC',
    title: meta.title || `RFC ${id}`,
    abstract: meta.abstract || undefined,
    url: `https://www.rfc-editor.org/rfc/rfc${id}.html`,
    txt_url: `https://www.rfc-editor.org/rfc/rfc${id}.txt`,
    sources: [
      { source: 'rfc-editor', url: `https://www.rfc-editor.org/rfc/rfc${id}.html` }
    ],
  };
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(rec, null, 2));
  count++;
}

// Write an index file
const index = fs.readdirSync(OUT).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''));
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));

console.log(`Built ${count} RFC references → ${OUT}`);

