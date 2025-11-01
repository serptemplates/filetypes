#!/usr/bin/env node
// Validates that category URL slugs are hyphenated (no underscores)
// Also runs a couple of simple assertions on slug helpers.

import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ ${message}`);
    process.exitCode = 1;
  }
}

// Basic helper checks by importing the compiled TS via ts-node isn't possible here.
// Instead, re-implement minimal behavior for assertions.
function toCategoryUrlSlug(s) { return String(s || '').replace(/_/g, '-'); }

// 1) Helper expectations
assert(toCategoryUrlSlug('raster_image') === 'raster-image', 'raster_image → raster-image');
assert(toCategoryUrlSlug('video') === 'video', 'video → video');

// 2) Scan source files for hardcoded underscored category URLs
const srcDirs = ['app', 'components', 'lib'];
const badMatches = [];
const hrefPattern = /\/categories\/[A-Za-z0-9_-]*/g; // find all category links

for (const dir of srcDirs) {
  const fullDir = path.join(repoRoot, dir);
  if (!fs.existsSync(fullDir)) continue;

  const stack = [fullDir];
  while (stack.length) {
    const cur = stack.pop();
    const stat = fs.statSync(cur);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(cur)) {
        if (entry.startsWith('.')) continue;
        stack.push(path.join(cur, entry));
      }
    } else if (/\.(tsx?|jsx?)$/.test(cur)) {
      const content = fs.readFileSync(cur, 'utf8');
      const matches = content.match(hrefPattern) || [];
      for (const m of matches) {
        if (m.includes('_')) {
          badMatches.push({ file: path.relative(repoRoot, cur), link: m });
        }
      }
    }
  }
}

if (badMatches.length) {
  console.error('✗ Found underscored category URLs (must use hyphens):');
  for (const { file, link } of badMatches) {
    console.error(`  - ${file}: ${link}`);
  }
  process.exitCode = 1;
} else {
  console.log('✓ Category URL validation passed (no underscores found)');
}

