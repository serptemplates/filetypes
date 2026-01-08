#!/usr/bin/env node
// Report per-slug content completeness and word counts from the DB.
// Counts optional fields in DB tables (excludes required slug/extension/name).
//
// Usage:
//   node scripts/report-db-content.mjs [--db <path>] [--format csv|json]

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const DEFAULT_DB = path.resolve('.data', 'filetypes.db');
const FIELD_KEYS = [
  'summary',
  'developer',
  'category',
  'last_updated',
  'mime',
  'containers',
  'related',
  'programs',
  'images',
  'technical_info',
  'how_to_open',
  'how_to_convert',
];

function parseArgs(argv) {
  const args = { db: DEFAULT_DB, format: 'csv' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--db') {
      args.db = path.resolve(argv[++i] || '');
    } else if (a === '--format') {
      args.format = String(argv[++i] || 'csv');
    } else if (a === '--json') {
      args.format = 'json';
    } else if (a === '--csv') {
      args.format = 'csv';
    }
  }
  args.format = args.format.toLowerCase();
  return args;
}

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function countWords(value) {
  if (value == null) return 0;
  const s = String(value).trim();
  if (!s) return 0;
  return s.split(/\s+/).length;
}

function getCountMap(db, sql) {
  const map = new Map();
  const res = db.exec(sql)[0];
  if (!res) return map;
  const slugIdx = res.columns.indexOf('file_type_slug');
  const cntIdx = res.columns.indexOf('cnt');
  for (const row of res.values) {
    map.set(String(row[slugIdx]), Number(row[cntIdx] || 0));
  }
  return map;
}

function getWordCountMap(db, sql, textCol) {
  const map = new Map();
  const res = db.exec(sql)[0];
  if (!res) return map;
  const slugIdx = res.columns.indexOf('file_type_slug');
  const textIdx = res.columns.indexOf(textCol);
  for (const row of res.values) {
    const slug = String(row[slugIdx]);
    const current = map.get(slug) || 0;
    map.set(slug, current + countWords(row[textIdx]));
  }
  return map;
}

function escapeCsv(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const { db: dbPath, format } = parseArgs(process.argv);
if (!fs.existsSync(dbPath)) {
  console.error(`Missing DB at ${dbPath}. Run: pnpm run db:migrate && pnpm run db:seed:all`);
  process.exit(1);
}
if (format !== 'csv' && format !== 'json') {
  console.error(`Unknown format "${format}". Use --format csv|json.`);
  process.exit(1);
}

const SQL = await initSqlJs({
  locateFile: (f) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', f),
});
const db = new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)));

const fileTypesRes = db.exec(
  'SELECT slug, extension, name, summary, developer, category, last_updated FROM file_types ORDER BY slug'
)[0];
if (!fileTypesRes) {
  console.log('No file_types records found.');
  process.exit(0);
}

const idx = Object.fromEntries(fileTypesRes.columns.map((c, i) => [c, i]));
const rows = fileTypesRes.values.map((r) => ({
  slug: String(r[idx.slug]),
  extension: r[idx.extension],
  name: r[idx.name],
  summary: r[idx.summary],
  developer: r[idx.developer],
  category: r[idx.category],
  last_updated: r[idx.last_updated],
}));

const counts = {
  mime: getCountMap(db, 'SELECT file_type_slug, COUNT(*) AS cnt FROM file_type_mime GROUP BY file_type_slug'),
  containers: getCountMap(db, 'SELECT file_type_slug, COUNT(*) AS cnt FROM file_type_container GROUP BY file_type_slug'),
  related: getCountMap(db, 'SELECT file_type_slug, COUNT(*) AS cnt FROM file_type_related GROUP BY file_type_slug'),
  programs: getCountMap(db, 'SELECT file_type_slug, COUNT(*) AS cnt FROM file_type_programs GROUP BY file_type_slug'),
  images: getCountMap(db, 'SELECT file_type_slug, COUNT(*) AS cnt FROM file_type_images GROUP BY file_type_slug'),
  technical_info: getCountMap(db, 'SELECT file_type_slug, COUNT(*) AS cnt FROM file_type_technical GROUP BY file_type_slug'),
  how_to_open: getCountMap(db, 'SELECT file_type_slug, COUNT(*) AS cnt FROM file_type_how_open GROUP BY file_type_slug'),
  how_to_convert: getCountMap(db, 'SELECT file_type_slug, COUNT(*) AS cnt FROM file_type_how_convert GROUP BY file_type_slug'),
};

const words = {
  technical_info: getWordCountMap(db, 'SELECT file_type_slug, content FROM file_type_technical', 'content'),
  how_to_open: getWordCountMap(db, 'SELECT file_type_slug, instruction FROM file_type_how_open', 'instruction'),
  how_to_convert: getWordCountMap(db, 'SELECT file_type_slug, instruction FROM file_type_how_convert', 'instruction'),
};

const records = rows.map((row) => {
  const slug = row.slug;
  const present = {
    summary: hasText(row.summary),
    developer: hasText(row.developer),
    category: hasText(row.category),
    last_updated: hasText(row.last_updated),
    mime: (counts.mime.get(slug) || 0) > 0,
    containers: (counts.containers.get(slug) || 0) > 0,
    related: (counts.related.get(slug) || 0) > 0,
    programs: (counts.programs.get(slug) || 0) > 0,
    images: (counts.images.get(slug) || 0) > 0,
    technical_info: (counts.technical_info.get(slug) || 0) > 0,
    how_to_open: (counts.how_to_open.get(slug) || 0) > 0,
    how_to_convert: (counts.how_to_convert.get(slug) || 0) > 0,
  };
  const fieldsTotal = FIELD_KEYS.length;
  const fieldsFilled = FIELD_KEYS.filter((k) => present[k]).length;
  const fieldsEmpty = fieldsTotal - fieldsFilled;

  const summaryWords = countWords(row.summary);
  const technicalWords = words.technical_info.get(slug) || 0;
  const openWords = words.how_to_open.get(slug) || 0;
  const convertWords = words.how_to_convert.get(slug) || 0;
  const totalWords = summaryWords + technicalWords + openWords + convertWords;

  return {
    slug,
    fields_total: fieldsTotal,
    fields_filled: fieldsFilled,
    fields_empty: fieldsEmpty,
    summary_words: summaryWords,
    technical_words: technicalWords,
    how_to_open_words: openWords,
    how_to_convert_words: convertWords,
    total_words: totalWords,
    fields_present: FIELD_KEYS.filter((k) => present[k]),
    fields_missing: FIELD_KEYS.filter((k) => !present[k]),
  };
});

if (format === 'json') {
  console.log(JSON.stringify(records, null, 2));
  process.exit(0);
}

const header = [
  'slug',
  'fields_total',
  'fields_filled',
  'fields_empty',
  'summary_words',
  'technical_words',
  'how_to_open_words',
  'how_to_convert_words',
  'total_words',
].join(',');
console.log(header);
for (const r of records) {
  const line = [
    r.slug,
    r.fields_total,
    r.fields_filled,
    r.fields_empty,
    r.summary_words,
    r.technical_words,
    r.how_to_open_words,
    r.how_to_convert_words,
    r.total_words,
  ].map(escapeCsv).join(',');
  console.log(line);
}
