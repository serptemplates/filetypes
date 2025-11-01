#!/usr/bin/env node
// Converts date-like fields to ISO 8601 UTC (…Z). Use --write to persist changes.

import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const write = args.has('--write');

const targets = [
  path.join(repoRoot, 'public', 'data', 'files', 'individual'),
  path.join(repoRoot, 'public', 'data', 'files')
];

const dateKeys = new Set([
  'lastUpdated', 'last_updated', 'updated_at', 'date', 'retrieved_at', 'created_at'
]);

const isoStrict = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

function toIsoUtcZ(val) {
  if (typeof val !== 'string' && !(val instanceof Date) && typeof val !== 'number') return null;
  try {
    if (typeof val === 'string' && dateOnly.test(val)) {
      // Treat bare date as midnight UTC
      return new Date(val + 'T00:00:00.000Z').toISOString();
    }
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function transform(obj, file, pathParts, changes) {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => transform(item, file, pathParts.concat(String(idx)), changes));
      return;
    }
    for (const [k, v] of Object.entries(obj)) {
      const nextPath = pathParts.concat(k);
      if (dateKeys.has(k)) {
        if (typeof v === 'string' && !isoStrict.test(v)) {
          const iso = toIsoUtcZ(v);
          if (iso) {
            changes.push({ file, keyPath: nextPath.join('.'), from: v, to: iso });
            obj[k] = iso;
          }
        }
      }
      transform(v, file, nextPath, changes);
    }
  }
}

let totalFiles = 0;
let totalChanges = 0;
const preview = [];

for (const base of targets) {
  if (!fs.existsSync(base)) continue;

  const stack = [base];
  while (stack.length) {
    const cur = stack.pop();
    const stat = fs.statSync(cur);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(cur)) {
        if (entry.startsWith('.')) continue;
        stack.push(path.join(cur, entry));
      }
    } else if (cur.endsWith('.json')) {
      try {
        const content = fs.readFileSync(cur, 'utf8');
        const json = JSON.parse(content);
        const changes = [];
        transform(json, path.relative(repoRoot, cur), [], changes);
        if (changes.length) {
          totalChanges += changes.length;
          preview.push(...changes.slice(0, Math.max(0, 50 - preview.length)));
          if (write) {
            fs.writeFileSync(cur, JSON.stringify(json, null, 2) + '\n');
          }
        }
        totalFiles++;
      } catch (e) {
        console.error(`Skipping invalid JSON: ${cur}`, e?.message || e);
      }
    }
  }
}

if (totalChanges === 0) {
  console.log(`✓ No date changes needed across ${totalFiles} file(s)`);
} else {
  console.log(`${write ? '✓ Wrote' : '→ Would write'} ${totalChanges} date change(s) across ${totalFiles} file(s)`);
  if (preview.length) {
    console.log('Examples:');
    for (const ex of preview) {
      console.log(`  - ${ex.file} > ${ex.keyPath}: ${ex.from} → ${ex.to}`);
    }
    if (totalChanges > preview.length) console.log('  … more changes not shown …');
  }
  if (!write) {
    console.log('Run with --write to apply changes.');
  }
}

