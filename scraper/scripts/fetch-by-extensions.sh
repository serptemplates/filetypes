#!/usr/bin/env bash
set -euo pipefail

# Fast, HTML-only concurrent fetch of detail pages by extension list.
#
# Usage:
#   bash scraper/scripts/fetch-by-extensions.sh <source> <extensions.txt> [concurrency]
#     source: fileinfo | fileorg | filext
#     extensions.txt: one extension per line (case-insensitive, without dot)
#     concurrency: optional, default 16
#
# Note: docs.fileformat.com pages are category-based; use fetch-recursive.sh for that host.

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
RAW_DIR="$ROOT_DIR/raw"
mkdir -p "$RAW_DIR"

SRC="${1:-}"
LIST="${2:-}"
PARALLEL="${3:-16}"

if [[ -z "$SRC" || -z "$LIST" ]]; then
  echo "Usage: $0 <fileinfo|fileorg|filext> <extensions.txt> [concurrency]" >&2
  exit 1
fi

map_url() {
  local src="$1" ext="$2"
  case "$src" in
    fileinfo) echo "https://fileinfo.com/extension/${ext}" ;;
    fileorg)  echo "https://file.org/extension/${ext}" ;;
    filext)   upper=$(printf '%s' "$ext" | tr '[:lower:]' '[:upper:]'); echo "https://filext.com/file-extension/${upper}" ;;
    *) echo "" ;;
  esac
}

OUT_DIR="$RAW_DIR/$SRC/by-ext"
mkdir -p "$OUT_DIR"

export -f map_url

cat "$LIST" | sed -E 's/^\.+//' | awk 'NF {print tolower($0)}' | sort -u | \
  xargs -n1 -P "$PARALLEL" -I {} bash -c '
    ext="$1"; src="$2"; out_dir="$3"
    url=$(map_url "$src" "$ext")
    out="$out_dir/${ext}.html"
    if [[ -z "$url" ]]; then echo "skip $ext"; exit 0; fi
    echo "GET $url -> $out"
    curl -sSL --compressed -A "serp-filetypes-fetcher/1.0" "$url" -o "$out" || echo "failed: $url"
  ' _ {} "$SRC" "$OUT_DIR"

echo "Done. Saved HTML to $OUT_DIR" 
