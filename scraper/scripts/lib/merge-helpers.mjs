// Helper utilities for merging partial filetype records

export function pickLongest(...vals) {
  const arr = vals.filter(Boolean).map(String);
  if (!arr.length) return undefined;
  return arr.sort((a, b) => b.length - a.length)[0];
}

export function cleanName(name, ext) {
  if (!name) return undefined;
  let n = String(name).trim();
  n = n.replace(/^What\s+(is|are)\s+/i, '').trim();
  n = n.replace(/\?+$/,'').trim();
  n = n.replace(/\bFile\s*Extension\b/i, '').trim();
  n = n.replace(/\s*-\s*[^-]*File\s*Format$/i, '').trim();
  if (!n) n = ext.toUpperCase() + ' File';
  return n;
}

export function preferName(records, ext) {
  const fi = records.find(r => r.source === 'fileinfo.com' && r.type_name);
  if (fi?.type_name) return cleanName(fi.type_name, ext);
  const ff = records.find(r => r.source === 'fileformat.com' && r.name);
  if (ff?.name) return cleanName(ff.name, ext);
  const longest = pickLongest(...records.map(r => r.name));
  return cleanName(longest, ext);
}

export function mergePrograms(records) {
  const acc = {};
  for (const r of records) {
    const p = r.programs || {};
    for (const [platform, list] of Object.entries(p)) {
      if (!acc[platform]) acc[platform] = [];
      for (const item of list) {
        const exists = acc[platform].some(x => x.name?.toLowerCase() === item.name?.toLowerCase());
        if (!exists) acc[platform].push(item);
      }
    }
  }
  for (const k of Object.keys(acc)) acc[k] = acc[k].slice(0, 20);
  return Object.keys(acc).length ? acc : undefined;
}

export function unionStrings(records, key) {
  const set = new Set();
  for (const r of records) {
    const val = r[key];
    if (Array.isArray(val)) val.forEach(v => v && set.add(String(v)));
  }
  return Array.from(set);
}

export function unionHowTo(records, key) {
  const acc = new Set();
  for (const r of records) {
    const obj = r[key];
    if (obj && Array.isArray(obj.instructions)) {
      for (const s of obj.instructions) if (s) acc.add(String(s));
    }
  }
  const list = Array.from(acc);
  return list.length ? { instructions: list } : undefined;
}

export function unionMagic(records) {
  const set = new Set();
  const out = [];
  for (const r of records) {
    for (const m of r.magic || []) {
      const key = `${m.hex}|${m.offset ?? ''}`;
      if (set.has(key)) continue;
      set.add(key);
      out.push({ hex: m.hex, offset: m.offset });
    }
  }
  return out.length ? out : undefined;
}

export function preferCategory(records) {
  const ff = records.find(r => r.source === 'fileformat.com' && r.category);
  if (ff) return ff.category;
  const any = records.find(r => r.category);
  return any?.category;
}

export function mergeImages(records) {
  const out = [];
  const seen = new Set();
  for (const r of records) {
    for (const img of r.images || []) {
      if (!img?.url) continue;
      if (!/^https?:\/\//i.test(img.url)) continue;
      if (seen.has(img.url)) continue;
      seen.add(img.url);
      out.push({ url: img.url, alt: img.alt, caption: img.caption });
    }
  }
  return out.slice(0, 10);
}

