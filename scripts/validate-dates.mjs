#!/usr/bin/env node
// Scans JSON data files for date fields and validates ISO 8601 UTC (ending with Z)

import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const targets = [
  path.join(repoRoot, 'public', 'data', 'files', 'individual'),
  path.join(repoRoot, 'public', 'data', 'files')
];

const dateKeys = new Set([
  'lastUpdated', 'last_updated', 'updated_at', 'date', 'retrieved_at', 'created_at'
]);

const isoRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function isIsoUtcZString(value) {
  if (typeof value !== 'string') return false;
  if (!isoRe.test(value)) return false;
  const ts = Date.parse(value);
  return !Number.isNaN(ts);
}

function visit(obj, file, pathParts, failures) {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => visit(item, file, pathParts.concat(String(idx)), failures));
      return;
    }
    for (const [k, v] of Object.entries(obj)) {
      const nextPath = pathParts.concat(k);
      if (dateKeys.has(k)) {
        if (!isIsoUtcZString(v)) {
          failures.push({ file, keyPath: nextPath.join('.'), value: v });
        }
      }
      visit(v, file, nextPath, failures);
    }
  }
}

let totalChecked = 0;
const failures = [];

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
        visit(json, path.relative(repoRoot, cur), [], failures);
        totalChecked++;
      } catch (e) {
        console.error(`Skipping invalid JSON: ${cur}`, e?.message || e);
      }
    }
  }
}

if (failures.length) {
  console.error(`✗ Date validation failed in ${failures.length} place(s) across ${totalChecked} file(s):`);
  for (const f of failures.slice(0, 50)) {
    console.error(`  - ${f.file} > ${f.keyPath}: ${JSON.stringify(f.value)}`);
  }
  if (failures.length > 50) console.error('  … more errors truncated …');
  process.exit(1);
} else {
  console.log(`✓ Dates valid (ISO UTC) across ${totalChecked} file(s)`);
}

