// Drizzle ORM schema for core catalogs (SQLite flavor). This provides a concrete
// DB shape; you can adapt to Postgres by swapping imports to drizzle-orm/pg-core.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const fileTypes = sqliteTable('file_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  extension: text('extension').notNull(),
  name: text('name').notNull(),
  summary: text('summary'),
  category: text('category'),
  categorySlug: text('category_slug'),
  lastUpdated: text('last_updated'),
});

export const fileTypeMime = sqliteTable('file_type_mime', {
  fileTypeSlug: text('file_type_slug').notNull(),
  mime: text('mime').notNull(),
}, (t) => ({
  pk: sql`PRIMARY KEY (${t.fileTypeSlug}, ${t.mime})`,
}));

export const fileTypeContainer = sqliteTable('file_type_container', {
  fileTypeSlug: text('file_type_slug').notNull(),
  container: text('container').notNull(),
}, (t) => ({
  pk: sql`PRIMARY KEY (${t.fileTypeSlug}, ${t.container})`,
}));

export const fileTypeRelated = sqliteTable('file_type_related', {
  fileTypeSlug: text('file_type_slug').notNull(),
  related: text('related').notNull(),
}, (t) => ({
  pk: sql`PRIMARY KEY (${t.fileTypeSlug}, ${t.related})`,
}));

export const fileTypePrograms = sqliteTable('file_type_programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileTypeSlug: text('file_type_slug').notNull(),
  platform: text('platform').notNull(),
  name: text('name').notNull(),
  url: text('url'),
  license: text('license'),
});

export const fileTypeImages = sqliteTable('file_type_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileTypeSlug: text('file_type_slug').notNull(),
  url: text('url').notNull(),
  alt: text('alt'),
  caption: text('caption'),
});

export const fileTypeTech = sqliteTable('file_type_technical', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileTypeSlug: text('file_type_slug').notNull(),
  content: text('content').notNull(),
});

export const fileTypeOpen = sqliteTable('file_type_how_open', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileTypeSlug: text('file_type_slug').notNull(),
  instruction: text('instruction').notNull(),
});

export const fileTypeConvert = sqliteTable('file_type_how_convert', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileTypeSlug: text('file_type_slug').notNull(),
  instruction: text('instruction').notNull(),
});

export const fileTypeSources = sqliteTable('file_type_sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileTypeSlug: text('file_type_slug').notNull(),
  source: text('source'),
  url: text('url'),
  retrievedAt: text('retrieved_at'),
});

// MIME catalog
export const mimes = sqliteTable('mimes', {
  full: text('full').primaryKey(), // image/heic
  type: text('type').notNull(),
  subtype: text('subtype').notNull(),
});

export const mimeExtensions = sqliteTable('mime_extensions', {
  full: text('full').notNull(),
  extension: text('extension').notNull(),
}, (t) => ({
  pk: sql`PRIMARY KEY (${t.full}, ${t.extension})`,
}));

// Containers
export const containers = sqliteTable('containers', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
});

export const containerExtensions = sqliteTable('container_extensions', {
  slug: text('slug').notNull(),
  extension: text('extension').notNull(),
}, (t) => ({ pk: sql`PRIMARY KEY (${t.slug}, ${t.extension})` }));

// Codecs
export const codecs = sqliteTable('codecs', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  family: text('family'),
});

export const containerCodec = sqliteTable('container_codec', {
  container: text('container').notNull(),
  kind: text('kind').notNull(), // 'video' | 'audio' | 'subtitle'
  codec: text('codec').notNull(),
}, (t) => ({ pk: sql`PRIMARY KEY (${t.container}, ${t.kind}, ${t.codec})` }));

// Signatures
export const signatures = sqliteTable('signatures', {
  id: text('id').primaryKey(),
  hex: text('hex').notNull(), // space-separated bytes e.g. "FF D8"
  offset: integer('offset'),
  description: text('description'),
});

export const signatureDetects = sqliteTable('signature_detects', {
  id: text('id').notNull(),
  detects: text('detects').notNull(),
}, (t) => ({ pk: sql`PRIMARY KEY (${t.id}, ${t.detects})` }));

