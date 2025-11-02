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
