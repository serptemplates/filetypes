
---

## Option 1: Polite fetch via wget

Use the built-in wget script with seed URL lists.

Setup seeds (edit these files and add URLs to fetch):
- `scraper/data/seeds/fileinfo.txt`
- `scraper/data/seeds/fileorg.txt`
- `scraper/data/seeds/filext.txt`
- `scraper/data/seeds/fileformat.txt`

Fetch (writes HTML to `scraper/raw/<source>/`):
```bash
bash scraper/scripts/fetch-wget.sh all
# or a single source
bash scraper/scripts/fetch-wget.sh fileformat
```

Notes:
- The script sets a polite user-agent, respects robots.txt, limits rate, and waits between requests.
- It only fetches the listed pages plus requisite assets. To crawl more, expand the seed lists (or mirror with your own crawler).

---

## Option 1b: Recursive mirrors (stay within host and path)

To mirror entire sections (recursively) without leaving the domain or going up the path:

```bash
# Mirror all four sources into scraper/raw/<source>/
bash scraper/scripts/fetch-recursive.sh all

# Or one at a time
bash scraper/scripts/fetch-recursive.sh fileformat
bash scraper/scripts/fetch-recursive.sh fileinfo
bash scraper/scripts/fetch-recursive.sh fileorg
bash scraper/scripts/fetch-recursive.sh filext
```

Tuning via env vars (optional):
- `WGET_DEPTH` (default `0` = unlimited depth)
- `WGET_RATE` (default `200k`)
- `WGET_WAIT` (default `1` second between requests, randomised)
- `WGET_UA` (custom user agent)

Example (depth-limited and slower):
```bash
WGET_DEPTH=2 WGET_RATE=100k WGET_WAIT=2 bash scraper/scripts/fetch-recursive.sh fileformat
```

This uses `--recursive --no-parent --domains=<host> --include-directories=<paths>` to ensure we only crawl down from the starting paths and never leave the target host.

Tip: Override include paths per run via `WGET_INCLUDE`.

Examples:
```bash
# FileInfo: include listings and detail pages
WGET_INCLUDE="/extension,/filetypes" \
WGET_HTML_ONLY=1 WGET_WAIT=0 WGET_RANDOM_WAIT=0 WGET_RATE=0 WGET_DEPTH=3 \
  bash scraper/scripts/fetch-recursive.sh fileinfo

# File.org: detail pages only
WGET_INCLUDE="/extension" \
WGET_HTML_ONLY=1 WGET_WAIT=0 WGET_RANDOM_WAIT=0 WGET_RATE=0 WGET_DEPTH=3 \
  bash scraper/scripts/fetch-recursive.sh fileorg
```

---

## Option 1c: Fast detail pages by extension list (concurrent)

If you already have a list of extensions, fetch only the detail pages (HTML-only) with concurrency:

```bash
# Prepare list: one extension per line, without dot
printf "pdf\njpg\nzip\nheic\n" > scraper/data/extensions.txt

# Fetch from fileinfo (16 concurrent by default)
bash scraper/scripts/fetch-by-extensions.sh fileinfo scraper/data/extensions.txt 24

# Fetch from file.org and filext as well
bash scraper/scripts/fetch-by-extensions.sh fileorg scraper/data/extensions.txt 24
bash scraper/scripts/fetch-by-extensions.sh filext scraper/data/extensions.txt 24
```

Output is saved to `scraper/raw/<source>/by-ext/*.html`.

This is much faster than recursive mirrors and downloads only the HTML pages we parse, skipping assets.

---

## Starting from scratch (no old data)

1) Fetch docs.fileformat.com (HTML-only):
```bash
WGET_HTML_ONLY=1 WGET_WAIT=0 WGET_RANDOM_WAIT=0 WGET_RATE=0 \
  bash scraper/scripts/fetch-recursive.sh fileformat
```

2) Generate an extensions list from mime-db:
```bash
pnpm -C scraper gen:exts
# file at: scraper/data/extensions.txt
```

3) Fetch detail pages concurrently from other sources:
```bash
bash scraper/scripts/fetch-by-extensions.sh fileinfo scraper/data/extensions.txt 48
bash scraper/scripts/fetch-by-extensions.sh fileorg  scraper/data/extensions.txt 48
bash scraper/scripts/fetch-by-extensions.sh filext   scraper/data/extensions.txt 48
```

4) Build normalized data, merge, enrich, combine:
```bash
pnpm -C scraper build
```

5) Integrate into the app:
```bash
node scraper/scripts/integrate-data.mjs
```

Tip: you can run step 3 in parallel with step 1 to maximize throughput.

---

## Growing the extension list automatically

After you fetch any HTML (recursive or by-extensions), scan the downloaded pages and outputs to expand the list:

```bash
pnpm -C scraper gen:exts:scan
# updates scraper/data/extensions.txt with union of:
#  - mime-db extensions
#  - extensions found in scraper/raw/** (links to /extension/* or /file-extension/*)
#  - extensions present in scraper/out/** and out-sources/** JSON
```

Then re-run the fast detail-page fetchers with the expanded list to improve coverage.

---

## Option 2: High‑concurrency fetch via Zyte API

If you have a Zyte subscription, use the async Python fetcher to pull pages quickly and safely through Zyte's infrastructure.

### Setup
```bash
cd scripts
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ZYTE_API_KEY=YOUR_KEY
export ZYTE_CONCURRENCY=5   # optional
export ZYTE_TIMEOUT=30        # optional
python fetch_zyte_api.py      # writes HTML to ../raw/
```

Then run the same parse/enrich/combine steps from the app root:
```bash
cd ..
npm run build
```

---

## Option 2: High‑concurrency fetch via Zyte API

Use the async Python fetcher to pull pages via Zyte.

### Setup
```bash
cd scripts
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ZYTE_API_KEY=YOUR_KEY
export ZYTE_CONCURRENCY=5   # optional
export ZYTE_TIMEOUT=30        # optional
python fetch_zyte_api.py      # writes HTML to ../raw/
```
Then from app root:
```bash
cd .. && npm run build
```

---

## Parse → Merge → Enrich → Integrate

From repo root:
```bash
pnpm -C scraper build           # parse-sources → merge → enrich → combine
node scraper/scripts/integrate-data.mjs
pnpm build                      # build the Next app
```

You can drop HTML anywhere under `scraper/raw/` (subfolders ok). The parser auto-detects source per page and normalizes it.
