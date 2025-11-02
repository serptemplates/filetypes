-- SQLite schema for file types and related tables (Cloudflare D1-compatible shape)
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS file_types (
  slug TEXT PRIMARY KEY,
  extension TEXT NOT NULL,
  name TEXT NOT NULL,
  summary TEXT,
  developer TEXT,
  category TEXT,
  last_updated TEXT
);

CREATE TABLE IF NOT EXISTS file_type_mime (
  file_type_slug TEXT NOT NULL,
  mime TEXT NOT NULL,
  PRIMARY KEY (file_type_slug, mime)
);

CREATE TABLE IF NOT EXISTS file_type_container (
  file_type_slug TEXT NOT NULL,
  container TEXT NOT NULL,
  PRIMARY KEY (file_type_slug, container)
);

CREATE TABLE IF NOT EXISTS file_type_related (
  file_type_slug TEXT NOT NULL,
  related TEXT NOT NULL,
  PRIMARY KEY (file_type_slug, related)
);

CREATE TABLE IF NOT EXISTS file_type_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_type_slug TEXT NOT NULL,
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  license TEXT
);

CREATE TABLE IF NOT EXISTS file_type_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_type_slug TEXT NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  caption TEXT
);

CREATE TABLE IF NOT EXISTS file_type_technical (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_type_slug TEXT NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS file_type_how_open (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_type_slug TEXT NOT NULL,
  instruction TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS file_type_how_convert (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_type_slug TEXT NOT NULL,
  instruction TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_file_types_category ON file_types(category);
CREATE INDEX IF NOT EXISTS idx_programs_slug ON file_type_programs(file_type_slug);
CREATE INDEX IF NOT EXISTS idx_images_slug ON file_type_images(file_type_slug);
CREATE INDEX IF NOT EXISTS idx_tech_slug ON file_type_technical(file_type_slug);
CREATE INDEX IF NOT EXISTS idx_open_slug ON file_type_how_open(file_type_slug);
CREATE INDEX IF NOT EXISTS idx_convert_slug ON file_type_how_convert(file_type_slug);

-- MIME tables
CREATE TABLE IF NOT EXISTS mimes (
  full TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  subtype TEXT NOT NULL,
  iana_json TEXT
);

CREATE TABLE IF NOT EXISTS mime_extensions (
  full TEXT NOT NULL,
  extension TEXT NOT NULL,
  PRIMARY KEY (full, extension)
);

CREATE INDEX IF NOT EXISTS idx_mimes_type ON mimes(type);
CREATE INDEX IF NOT EXISTS idx_mime_ext_extension ON mime_extensions(extension);

-- References (e.g., RFCs)
CREATE TABLE IF NOT EXISTS refs (
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  title TEXT,
  url TEXT,
  body TEXT,
  PRIMARY KEY (kind, id)
);

-- Codecs catalog
CREATE TABLE IF NOT EXISTS codecs (
  id TEXT PRIMARY KEY,           -- canonical identifier (e.g., 'h264', 'hevc', 'av1', 'aac')
  kind TEXT NOT NULL,            -- 'video' | 'audio' | 'subtitle' | 'image'
  name TEXT NOT NULL,            -- display name
  summary TEXT,                  -- one-liner
  year INTEGER,                  -- first standard/publication year
  spec_url TEXT,                 -- canonical spec or landing page
  aliases_json TEXT,             -- JSON array of strings
  containers_json TEXT,          -- JSON array of container slugs (e.g., ['mp4','webm','mkv'])
  mimes_json TEXT,               -- JSON array of typical MIME strings
  content_md TEXT,               -- catch-all markdown content (unstructured)
  sources_json TEXT              -- JSON array of {label,url} provenance entries
);

-- Implementation-level codec listings (e.g., from FFmpeg)
CREATE TABLE IF NOT EXISTS codec_impls (
  source TEXT NOT NULL,           -- 'ffmpeg', etc.
  impl_id TEXT NOT NULL,          -- implementation identifier (e.g., 'h264', 'aac')
  kind TEXT NOT NULL,             -- 'video' | 'audio' | 'subtitle' | 'image' | 'other'
  decoder INTEGER,                -- 1/0/NULL (unknown)
  encoder INTEGER,                -- 1/0/NULL (unknown)
  desc TEXT,
  PRIMARY KEY (source, impl_id)
);

-- Map implementation codec IDs to curated codec families
CREATE TABLE IF NOT EXISTS codec_family_impls (
  family_id TEXT NOT NULL,
  source TEXT NOT NULL,
  impl_id TEXT NOT NULL,
  PRIMARY KEY (family_id, source, impl_id)
);
CREATE INDEX IF NOT EXISTS idx_codec_family_impls_source ON codec_family_impls(source);
CREATE INDEX IF NOT EXISTS idx_codec_family_impls_impl ON codec_family_impls(impl_id);
