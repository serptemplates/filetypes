#!/usr/bin/env bash
set -euo pipefail

# Fetch RFC text/HTML into scraper/raw/references/rfc
# Usage: bash scraper/scripts/fetch-rfc.sh 6015 3550 ...

DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_RAW="$DIR/raw/references/rfc"
mkdir -p "$OUT_RAW"

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <rfc-number> [more...]" >&2
  exit 1
fi

for n in "$@"; do
  id=$(echo "$n" | tr '[:upper:]' '[:lower:]' | sed 's/^rfc//')
  base="https://www.rfc-editor.org/rfc/rfc${id}"
  echo "Fetching RFC ${id} ..."
  curl -fsSL "${base}.txt" -o "$OUT_RAW/${id}.txt" || echo "warn: failed to fetch txt for ${id}" >&2
  curl -fsSL "${base}.html" -o "$OUT_RAW/${id}.html" || echo "warn: failed to fetch html for ${id}" >&2
done
echo "Saved to $OUT_RAW"

