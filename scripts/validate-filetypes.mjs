#!/usr/bin/env node
// Validate normalized FileType JSONs to ensure fields are present and normalized.
// Usage: node scripts/validate-filetypes.mjs [--dir <path>] [--strict]

import fs from 'node:fs';
import path from 'node:path';

function findInputDir(cliDir) {
  if (cliDir) return path.resolve(cliDir);
  const candidates = [
    'scraper/out-normalized',
    'scraper/out',
    'public/data/files/individual',
  ];
  for (const c of candidates) {
    const p = path.resolve(c);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
  }
  throw new Error('No input directory found. Pass --dir or build the scraper outputs.');
}

function parseArgs(argv) {
  const args = { strict: false, dir: undefined };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') args.strict = true;
    else if (a === '--dir') { args.dir = argv[++i]; }
  }
  return args;
}

function isIsoUtcZString(s) {
  // Strict-ish: 2025-11-01T18:24:49.378Z
  return typeof s === 'string' && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?Z$/.test(s);
}

function isMime(s) {
  return typeof s === 'string' && /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(s);
}

function isHexish(s) {
  return typeof s === 'string' && /^[0-9a-fA-F?*()\[\] \-]+$/.test(s);
}

function isHttpUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s);
}

function hyphenSlug(s) {
  return typeof s === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}

function cleanNameLooksOk(name) {
  if (!name || typeof name !== 'string') return false;
  const n = name.trim();
  if (!n) return false;
  if (/^What\s+(is|are)\b/i.test(n)) return false;
  if (/\bFile\s*Extension\b/i.test(n)) return false;
  return true;
}

const { strict, dir: cliDir } = parseArgs(process.argv);
const IN = findInputDir(cliDir);

const files = fs.readdirSync(IN).filter(f => f.endsWith('.json') && f !== 'filetypes.json');

const errors = [];
const coverage = {
  total: 0,
  present: {
    summary: 0,
    developer: 0,
    category: 0,
    category_slug: 0,
    mime: 0,
    containers: 0,
    related: 0,
    technical_info: 0,
    how_to_open: 0,
    how_to_convert: 0,
    common_filenames: 0,
    magic: 0,
    programs: 0,
    images: 0,
    sources: 0,
    last_updated: 0,
  },
};

function err(slug, field, msg) { errors.push({ slug, field, msg }); }

for (const f of files) {
  const rec = JSON.parse(fs.readFileSync(path.join(IN, f), 'utf8'));
  const slug = rec.slug || rec.extension || path.basename(f, '.json');
  coverage.total++;

  // Required
  if (!rec.slug || typeof rec.slug !== 'string') err(slug, 'slug', 'missing or not string');
  if (!rec.extension || typeof rec.extension !== 'string') err(slug, 'extension', 'missing or not string');
  if (!rec.name || !cleanNameLooksOk(rec.name)) err(slug, 'name', 'missing or looks unclean');

  // Normalization rules
  if (rec.slug && rec.slug !== rec.slug.toLowerCase()) err(slug, 'slug', 'must be lowercase');
  if (rec.extension && rec.extension !== rec.extension.toLowerCase()) err(slug, 'extension', 'must be lowercase');
  if (rec.slug && rec.extension && rec.slug !== rec.extension) err(slug, 'slug/extension', 'slug should equal extension');

  // Optional with validation
  if (rec.summary) coverage.present.summary++;
  if (rec.developer) coverage.present.developer++;
  if (rec.category) coverage.present.category++;
  if (rec.category_slug) {
    coverage.present.category_slug++;
    if (!hyphenSlug(rec.category_slug)) err(slug, 'category_slug', 'must be hyphenated');
  }
  if (Array.isArray(rec.mime)) {
    coverage.present.mime++;
    const uniq = new Set();
    for (const m of rec.mime) {
      if (!isMime(m)) err(slug, 'mime', `invalid: ${m}`);
      if (uniq.has(m)) err(slug, 'mime', `duplicate: ${m}`);
      uniq.add(m);
    }
  }
  if (Array.isArray(rec.containers)) coverage.present.containers++;
  if (Array.isArray(rec.related)) coverage.present.related++;
  if (rec.technical_info?.content) {
    coverage.present.technical_info++;
    if (!Array.isArray(rec.technical_info.content) || rec.technical_info.content.length === 0) {
      err(slug, 'technical_info', 'content must be non-empty array');
    }
  }
  if (rec.how_to_open?.instructions) {
    coverage.present.how_to_open++;
    if (!Array.isArray(rec.how_to_open.instructions) || rec.how_to_open.instructions.length === 0) {
      err(slug, 'how_to_open', 'instructions must be non-empty array');
    }
  }
  if (rec.how_to_convert?.instructions) {
    coverage.present.how_to_convert++;
    if (!Array.isArray(rec.how_to_convert.instructions) || rec.how_to_convert.instructions.length === 0) {
      err(slug, 'how_to_convert', 'instructions must be non-empty array');
    }
  }
  if (Array.isArray(rec.common_filenames)) coverage.present.common_filenames++;
  if (Array.isArray(rec.magic)) {
    coverage.present.magic++;
    for (const m of rec.magic) {
      if (!isHexish(m?.hex)) err(slug, 'magic.hex', `invalid: ${m?.hex}`);
      if (m?.offset != null && typeof m.offset !== 'number') err(slug, 'magic.offset', 'must be number when present');
    }
  }
  if (rec.programs && typeof rec.programs === 'object') {
    coverage.present.programs++;
    for (const [platform, list] of Object.entries(rec.programs)) {
      if (!Array.isArray(list)) err(slug, `programs.${platform}`, 'must be array');
      for (const item of list || []) {
        if (!item?.name) err(slug, `programs.${platform}.name`, 'missing');
        if (item?.url && !isHttpUrl(item.url)) err(slug, `programs.${platform}.url`, 'must be http(s)');
      }
    }
  }
  if (Array.isArray(rec.images)) {
    coverage.present.images++;
    for (const img of rec.images) {
      if (!isHttpUrl(img?.url)) err(slug, 'images.url', 'must be http(s)');
    }
  }
  if (Array.isArray(rec.sources)) {
    coverage.present.sources++;
    for (const s of rec.sources) {
      if (s?.url && !isHttpUrl(s.url)) err(slug, 'sources.url', 'must be http(s)');
      if (s?.retrieved_at && !isIsoUtcZString(s.retrieved_at)) err(slug, 'sources.retrieved_at', 'must be ISO UTC Z');
    }
  }
  if (rec.last_updated) {
    coverage.present.last_updated++;
    if (!isIsoUtcZString(rec.last_updated)) err(slug, 'last_updated', 'must be ISO UTC Z');
  }

  // Strict mode: enforce presence of many optional fields
  if (strict) {
    for (const k of ['summary','category','category_slug','mime','technical_info','how_to_open']) {
      if (!rec[k]) err(slug, k, 'missing (strict)');
    }
  }
}

// Report
const byField = new Map();
for (const e of errors) {
  const key = `${e.field}`;
  if (!byField.has(key)) byField.set(key, 0);
  byField.set(key, byField.get(key) + 1);
}

console.log(`Validated ${coverage.total} records in ${IN}`);
if (errors.length) {
  console.log(`\nErrors: ${errors.length}`);
  const top = Array.from(byField.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 15);
  for (const [field, count] of top) {
    console.log(` - ${field}: ${count}`);
  }
  // Print a few examples
  const sample = errors.slice(0, 20)
    .map(e => `   ${e.slug} :: ${e.field} :: ${e.msg}`)
    .join('\n');
  console.log(`\nSample:\n${sample}`);
}

// Coverage summary
console.log('\nField coverage (present count):');
for (const [k, v] of Object.entries(coverage.present)) {
  console.log(` - ${k}: ${v}/${coverage.total}`);
}

if (errors.length) process.exit(1);
console.log('\nAll good.');
