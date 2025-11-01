// Normalize a unified record and validate with an optional Zod schema

export function normalizeRecord(rec, FileTypeSchema) {
  const out = { ...rec };
  out.slug = String(out.slug || out.extension || '').toLowerCase();
  out.extension = String(out.extension || out.slug || '').toLowerCase();
  if (!out.name) out.name = out.extension ? out.extension.toUpperCase() + ' File' : 'Unknown File';
  if (Array.isArray(out.mime)) out.mime = Array.from(new Set(out.mime.map(String)));
  if (Array.isArray(out.related)) out.related = Array.from(new Set(out.related.map(String)));
  if (FileTypeSchema) return FileTypeSchema.parse(out);
  return out;
}

