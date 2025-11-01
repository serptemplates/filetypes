#!/usr/bin/env bash
set -euo pipefail

# Polite wget-based fetcher. Reads seed URL lists from scraper/data/seeds/*.txt
# and writes HTML into scraper/raw/<source>/ .
#
# Usage:
#   bash scraper/scripts/fetch-wget.sh [fileinfo|fileorg|filext|fileformat|all]

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
SEEDS_DIR="$ROOT_DIR/data/seeds"
RAW_DIR="$ROOT_DIR/raw"

mkdir -p "$RAW_DIR"

SOURCE="${1:-all}"

fetch_list() {
  local name="$1"; shift
  local seeds="$SEEDS_DIR/${name}.txt"
  local outdir="$RAW_DIR/${name}"
  mkdir -p "$outdir"
  if [[ ! -s "$seeds" ]]; then
    echo "No seeds at $seeds — add URLs to crawl." >&2
    return 0
  fi
  echo "Fetching $name pages into $outdir ..."

  # Polite flags:
  #  - wait with jitter, cap rate, set user agent, timestamping for resume
  #  - no recursive crawl by default; we fetch listed URLs + requisites only
  wget \
    --input-file="$seeds" \
    --directory-prefix="$outdir" \
    --adjust-extension \
    --timestamping \
    --page-requisites \
    --no-verbose \
    --random-wait \
    --wait=1 \
    --limit-rate=200k \
    --user-agent="serp-filetypes-fetcher/1.0 (respecting robots.txt)" \
    --execute robots=on \
    --convert-links
}

case "$SOURCE" in
  fileinfo|fileorg|filext|fileformat)
    fetch_list "$SOURCE" ;;
  all)
    for s in fileinfo fileorg filext fileformat; do fetch_list "$s"; done ;;
  *)
    echo "Unknown source '$SOURCE'. Use one of: fileinfo|fileorg|filext|fileformat|all" >&2
    exit 1 ;;
esac

echo "Done. HTML in $RAW_DIR/<source>/"

