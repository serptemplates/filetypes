#!/usr/bin/env node
// Augment MIME records with IANA registration details using locally cached HTML
// Looks for files under scraper/raw/mime/iana/<type>/<subtype>.html

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_MIME = path.resolve(ROOT, 'out-mime');
const RAW_IANA = path.resolve(ROOT, 'raw', 'mime', 'iana');

function readRec(full) {
  const [type, subtype] = full.split('/');
  const p = path.join(OUT_MIME, type, `${subtype}.json`);
  if (!fs.existsSync(p)) return null;
  return { path: p, data: JSON.parse(fs.readFileSync(p, 'utf8')) };
}

function parseIanaHtml(html, url) {
  const $ = cheerio.load(html);
  const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const getField = (label) => {
    const el = $('dt').filter((_, e) => text($(e).text()).toLowerCase().startsWith(label.toLowerCase()));
    if (!el.length) return undefined;
    const dd = el.next('dd');
    return text(dd.text());
  };

  const iana = {
    template_url: url,
    type_name: getField('Type name'),
    subtype_name: getField('Subtype name'),
    encoding_considerations: getField('Encoding considerations'),
    security_considerations: getField('Security considerations'),
    interoperability_considerations: getField('Interoperability considerations'),
    applications: getField('Applications that use this media type'),
    additional_information: getField('Additional information'),
    intended_usage: getField('Intended usage')?.toLowerCase(),
    restrictions_on_usage: getField('Restriction on usage'),
    change_controller: getField('Change controller'),
  };

  // Parameters (required/optional): extract bullet items of the form "o name: description"
  function parseParams(label) {
    const el = $('dt').filter((_, e) => text($(e).text()).toLowerCase().startsWith(label.toLowerCase()));
    if (!el.length) return [];
    const dd = el.next('dd');
    const out = [];
    dd.find('li, p').each((_, node) => {
      const t = text($(node).text());
      const m = t.match(/^o\s+([^:]+):\s*(.*)$/i) || t.match(/^([^:]+):\s*(.*)$/);
      if (m) out.push({ name: m[1].trim(), description: m[2].trim() });
    });
    return out;
  }
  const required = parseParams('Required parameters');
  const optional = parseParams('Optional parameters');
  if (required.length || optional.length) iana.parameters = { required, optional };

  // Published specifications / References: collect links
  const refs = [];
  const pubEl = $('dt').filter((_, e) => text($(e).text()).toLowerCase().startsWith('published specification'));
  if (pubEl.length) {
    const dd = pubEl.next('dd');
    dd.find('a[href]').each((_, a) => {
      const href = $(a).attr('href') || '';
      const title = text($(a).text());
      refs.push({ title: title || undefined, url: href, kind: /rfc/i.test(href) ? 'RFC' : 'Spec' });
    });
  }
  return { iana, refs };
}

function parseIanaText(txt, url) {
  const lines = txt.split(/\r?\n/);
  const getSingle = (prefix) => {
    const i = lines.findIndex(l => l.toLowerCase().startsWith(prefix.toLowerCase()));
    if (i === -1) return undefined;
    return lines[i].slice(prefix.length).trim().replace(/\.$/, '');
  };
  const iana = {
    template_url: url,
    type_name: getSingle('Type name: '),
    subtype_name: getSingle('Subtype name: '),
    encoding_considerations: undefined,
    security_considerations: undefined,
    interoperability_considerations: undefined,
    applications: undefined,
    additional_information: undefined,
    intended_usage: (getSingle('Intended usage: ') || '').toLowerCase() || undefined,
    restrictions_on_usage: getSingle('Restriction on usage: '),
    change_controller: getSingle('Change controller: '),
  };

  // Section extractor between headings like "Xyz:"
  function extractSection(head) {
    const start = lines.findIndex(l => l.toLowerCase().startsWith(head.toLowerCase()));
    if (start === -1) return undefined;
    const out = [];
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^[A-Z][A-Za-z &]+:\s*$/.test(line)) break; // next heading
      out.push(line);
    }
    const joined = out.join('\n').trim();
    return joined || undefined;
  }

  iana.encoding_considerations = extractSection('Encoding considerations:');
  iana.security_considerations = extractSection('Security considerations:');
  iana.interoperability_considerations = extractSection('Interoperability considerations:');
  iana.applications = extractSection('Applications that use this media type:');
  iana.additional_information = extractSection('Additional information:');

  // Parameters (required/optional)
  function extractParams(head) {
    const start = lines.findIndex(l => l.toLowerCase().startsWith(head.toLowerCase()));
    if (start === -1) return [];
    const out = [];
    let i = start + 1;
    while (i < lines.length) {
      const line = lines[i];
      if (/^[A-Z][A-Za-z &]+:\s*$/.test(line)) break;
      const m = line.match(/^o\s+([^:]+):\s*(.*)$/);
      if (m) {
        // accumulate continuation lines
        let desc = m[2];
        let j = i + 1;
        while (j < lines.length && !/^[A-Z][A-Za-z &]+:\s*$/.test(lines[j]) && !/^o\s+[^:]+:/i.test(lines[j])) {
          desc += '\n' + lines[j];
          j++;
        }
        out.push({ name: m[1].trim(), description: desc.trim() });
        i = j;
        continue;
      }
      i++;
    }
    return out;
  }
  const req = extractParams('Required parameters:');
  const optSection = extractSection('Optional parameters:');
  const opt = /None\.?/i.test(optSection || '') ? [] : extractParams('Optional parameters:');
  if (req.length || opt.length) iana.parameters = { required: req, optional: opt };

  // Published specification: linkify RFC numbers
  const pub = extractSection('Published specification:');
  const refs = [];
  if (pub) {
    const rfcs = pub.match(/RFC\s*(\d{3,5})/ig) || [];
    for (const tag of rfcs) {
      const num = (tag.match(/\d{3,5}/) || [])[0];
      if (num) refs.push({ title: `RFC ${num}`, url: `https://www.rfc-editor.org/rfc/rfc${num}.html`, kind: 'RFC' });
    }
  }

  return { iana, refs };
}

// Walk all MIME files; for each try to augment from RAW_IANA
function* walkMimeIndex() {
  const idxPath = path.join(OUT_MIME, 'index.json');
  const index = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
  for (const rec of index) yield rec.full;
}

let augmented = 0;
for (const full of walkMimeIndex()) {
  const [type, subtype] = full.split('/');
  const p = path.join(RAW_IANA, type, `${subtype}.html`);
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, 'utf8');
  const url = `https://www.iana.org/assignments/media-types/${type}/${subtype}`;
  let parsed;
  if (/(<\!doctype|<html|<head|<body|<dt\b|<dd\b|<div\b|<span\b|<h1\b|<h2\b|<h3\b|<pre\b|<p\b)/i.test(html)) parsed = parseIanaHtml(html, url);
  else {
    parsed = parseIanaText(html, url);
    // Always keep full template text for reference
    parsed.iana = { ...(parsed.iana || {}), template_text: html };
  }
  const { iana, refs } = parsed;
  const rec = readRec(full);
  if (!rec) continue;
  const data = rec.data;
  data.iana = { ...(data.iana || {}), ...iana };
  data.references = Array.from(new Set([...(data.references || []), ...refs].map(r => r.url))).map(u => {
    const found = [...(data.references || []), ...refs].find(x => x.url === u);
    return found;
  });
  fs.writeFileSync(rec.path, JSON.stringify(data, null, 2));
  augmented++;
}

console.log(`Augmented ${augmented} MIME records from IANA HTML in ${RAW_IANA}`);
