#!/usr/bin/env node
// Parse all HTML in raw/ by auto-detecting the source and writing
// normalized partials to out-sources/<source>/<ext>.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as fileorg from '../sources/fileorg.mjs';
import * as fileinfo from '../sources/fileinfo.mjs';
import * as filext from '../sources/filext.mjs';
import * as fileformat from '../sources/fileformat.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.resolve(ROOT, 'raw');
const OUT_SOURCES = path.resolve(ROOT, 'out-sources');
fs.mkdirSync(OUT_SOURCES, { recursive: true });

// Prefer docs.fileformat.com first as requested, then others.
const sources = [fileformat, fileinfo, fileorg, filext];

function collectHtmlFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlFiles(full, acc);
    else if (entry.isFile()) acc.push(full); // include files without .html (wget without --adjust-extension)
  }
  return acc;
}

function isCandidate(filePath) {
  const p = filePath.replace(/\\/g, '/');
  if (p.includes('docs.fileformat.com')) return true; // format pages often end with / -> index.html
  if (p.includes('/extension/')) return true;         // fileinfo/file.org detail pages
  if (p.includes('/file-extension/')) return true;    // filext detail pages
  if (p.includes('/by-ext/')) return true;            // our direct-fetch HTML-only
  return false;
}

function inferSource(filePath) {
  const p = filePath.replace(/\\/g, '/');
  if (p.includes('docs.fileformat.com')) return fileformat;
  if (p.includes('/fileinfo/')) return fileinfo;
  if (p.includes('fileinfo.com')) return fileinfo;
  if (p.includes('/fileorg/') || p.includes('file.org')) return fileorg;
  if (p.includes('/filext/') || p.includes('filext.com')) return filext;
  return null;
}

function deriveExt(filePath, html) {
  const base = path.basename(filePath).toLowerCase();
  // by-ext/<ext>.html
  const noExt = base.replace(/\.html?$/i, '');
  if (noExt && noExt !== 'index') return noExt;
  // docs.fileformat.com/.../<slug>/index.html
  const p = filePath.replace(/\\/g, '/');
  if (p.includes('docs.fileformat.com/')) {
    const parts = p.split('/');
    const idx = parts.findIndex(seg => seg === 'docs.fileformat.com');
    if (idx >= 0) {
      const tail = parts.slice(idx + 1).filter(Boolean);
      // expect: [category, slug, 'index.html']
      const last = tail[tail.length - 1];
      const prev = tail[tail.length - 2];
      if (last && last.toLowerCase().startsWith('index') && prev) return prev.toLowerCase();
      if (last && last !== 'index.html') return last.toLowerCase().replace(/\.html?$/i, '');
    }
  }
  // /extension/<ext>
  const parts = filePath.replace(/\\/g, '/').split('/');
  const ix = parts.lastIndexOf('extension');
  if (ix >= 0 && parts[ix+1]) return parts[ix+1].toLowerCase();
  // Title fallback
  try {
    const m = (html || '').match(/<title[^>]*>([^<]+)<\/title>/i);
    if (m) {
      const t = m[1];
      const mt = t.match(/^([^.\s]+)\s+File/i);
      if (mt) return mt[1].toLowerCase();
    }
  } catch {}
  return '';
}

const htmlFiles = collectHtmlFiles(RAW_DIR).filter(isCandidate);

let parsed = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  let matched = null;
  // Prefer detection
  for (const s of sources) {
    try { if (s.detect(html)) { matched = s; break; } } catch {}
  }
  // Infer from file path if detection fails
  if (!matched) matched = inferSource(file);
  // Last resort: try each parser
  if (!matched) {
    for (const s of sources) {
      try { const recTry = s.parse(html); if (recTry?.extension) { matched = s; break; } } catch {}
    }
  }
  if (!matched) {
    console.warn('No source detected for', file);
    continue;
  }
  let rec = null;
  try { rec = matched.parse(html); } catch {}
  if (!rec || !rec.extension) {
    // Fallback: derive slug from path/title
    const ext = deriveExt(file, html);
    if (!ext) { console.warn('Parse failed for', file); continue; }
    rec = rec || {};
    rec.slug = rec.slug || ext;
    rec.extension = rec.extension || ext;
    rec.name = rec.name || `${ext.toUpperCase()} File`;
    rec.source = rec.source || (inferSource(file) === fileformat ? 'fileformat.com' : (inferSource(file) === fileinfo ? 'fileinfo.com' : (inferSource(file) === fileorg ? 'file.org' : 'filext.com')));
  }
  const safeSource = (rec.source || 'unknown').replace(/[^a-z0-9_.-]+/gi, '_');
  const dir = path.join(OUT_SOURCES, safeSource);
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `${rec.slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(rec, null, 2));
  parsed++;
}

console.log('Parsed partials from', parsed, 'pages');
