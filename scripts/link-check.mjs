#!/usr/bin/env node
import { LinkChecker } from 'linkinator';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const checker = new LinkChecker();
const { links } = await checker.check({
  path: BASE_URL,
  recurse: true,
  concurrency: Number(process.env.CONCURRENCY || 12),
  timeout: Number(process.env.TIMEOUT || 30000),
  linksToSkip: [new RegExp(`^(?!${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`)],
});

const failures = links.filter(l => l.state === 'BROKEN' || (l.status && Number(l.status) >= 400));
const internalChecked = links.filter(l => (l.url || '').startsWith(BASE_URL));
console.log(`Checked ${internalChecked.length} internal links at ${BASE_URL}. Failures: ${failures.length}`);
if (failures.length) {
  for (const f of failures.slice(0, 50)) {
    console.log(` - ${f.url} -> ${f.status || f.state}`);
  }
  if (failures.length > 50) console.log(` ... and ${failures.length - 50} more`);
  process.exitCode = 1;
}

