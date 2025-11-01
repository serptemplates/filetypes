#!/usr/bin/env bash
set -euo pipefail

# Recursively mirror known sources into project-local folders, staying on host
# and only crawling within the specified path prefixes (no going up).
#
# Usage:
#   bash scraper/scripts/fetch-recursive.sh [fileformat|fileinfo|fileorg|filext|all]
#
# Tuning via env vars (optional):
#   WGET_DEPTH   (default 0 = unlimited)
#   WGET_RATE    (default 200k)
#   WGET_WAIT    (default 1)
#   WGET_UA      (default 'serp-filetypes-fetcher/1.0')

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
RAW_DIR="$ROOT_DIR/raw"
mkdir -p "$RAW_DIR"

TARGET="${1:-all}"

DEPTH="${WGET_DEPTH:-0}"
RATE="${WGET_RATE:-200k}"
WAIT_S="${WGET_WAIT:-1}"
UA="${WGET_UA:-serp-filetypes-fetcher/1.0}"
HTML_ONLY="${WGET_HTML_ONLY:-0}"
RANDOM_WAIT="${WGET_RANDOM_WAIT:-1}"
RESPECT_ROBOTS="${WGET_RESPECT_ROBOTS:-1}"

fetch_tree() {
  local name="$1"   # folder name under raw/
  local host="$2"   # domain to stay within
  local start="$3"  # starting URL
  local include="$4"  # comma-separated path prefixes to include

  local outdir="$RAW_DIR/$name"
  mkdir -p "$outdir"
  echo "\n==> Mirroring $host from $start into $outdir"

  # Base wget args
  ARGS=(
    --recursive \
    --no-parent \
    --level="$DEPTH" \
    --domains="$host" \
    --include-directories="$include" \
    --timestamping \
    --user-agent="$UA" \
    --directory-prefix="$outdir"
  )

  # Wait behavior
  if [[ "$WAIT_S" != "" ]]; then ARGS+=( --wait="$WAIT_S" ); fi
  if [[ "$RANDOM_WAIT" == "1" ]]; then ARGS+=( --random-wait ); fi

  # Rate limiting (omit when set to 0)
  if [[ "$RATE" != "0" && "$RATE" != "" ]]; then ARGS+=( --limit-rate="$RATE" ); fi

  # Robots.txt respect (on by default)
  if [[ "$RESPECT_ROBOTS" == "1" ]]; then ARGS+=( --execute robots=on ); fi

  if [[ "$HTML_ONLY" != "1" ]]; then
    ARGS+=( --page-requisites --adjust-extension --convert-links )
  else
    # HTML-only: still add --adjust-extension to save as .html; skip assets
    ARGS+=( --adjust-extension --reject-regex '\\.(css|js|json|jpg|jpeg|png|gif|svg|webp|ico|woff2?|ttf|eot)(\\?.*)?$' )
  fi

  wget "${ARGS[@]}" "$start"
}

case "$TARGET" in
  fileformat)
    # docs.fileformat.com: focus on key categories
    fetch_tree "fileformat" \
      "docs.fileformat.com" \
      "https://docs.fileformat.com/" \
      "/image,/audio,/video,/web,/compression,/database,/font,/page-description-language,/3d"
    ;;
  fileinfo)
    INC="${WGET_INCLUDE:-/extension,/filetypes}"
    fetch_tree "fileinfo" \
      "fileinfo.com" \
      "https://fileinfo.com/" \
      "$INC"
    ;;
  fileorg)
    INC="${WGET_INCLUDE:-/extension}"
    fetch_tree "fileorg" \
      "file.org" \
      "https://file.org/" \
      "$INC"
    ;;
  filext)
    INC="${WGET_INCLUDE:-/file-extension}"
    fetch_tree "filext" \
      "filext.com" \
      "https://filext.com/" \
      "$INC"
    ;;
  all)
    "$0" fileformat
    "$0" fileinfo
    "$0" fileorg
    "$0" filext
    ;;
  *)
    echo "Unknown target '$TARGET'. Use one of: fileformat|fileinfo|fileorg|filext|all" >&2
    exit 1
    ;;
esac

echo "\nAll done. See $RAW_DIR/<source>/ for mirrored pages."
