#!/usr/bin/env node
// Fetch Apache and nginx mime.types. We avoid third-party index sites.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW = path.resolve(ROOT, 'raw', 'mime');
fs.mkdirSync(RAW, { recursive: true });

async function fetchTo(url, file) {
  const res = await fetch(url, { headers: { 'user-agent': 'serp-filetypes/1.0 (+https://serp.co)' } });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(buf));
}

async function run() {
  await fetchTo('https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types', path.join(RAW, 'apache', 'mime.types'));
  await fetchTo('https://hg.nginx.org/nginx/raw-file/default/conf/mime.types', path.join(RAW, 'nginx', 'mime.types'));
  console.log(`Saved to ${RAW}/apache|nginx`);
}

run().catch(e => { console.error(e.message); process.exit(1); });
