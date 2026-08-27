#!/usr/bin/env bash
# smoke.sh — one command that proves the lab still works.
#
#   ./smoke.sh            # everything: unit tests + headless-Chrome page checks
#   SMOKE=5 ./smoke.sh    # fewer extra Sketchbook seeds (default 20, capped in-page at 200)
#
# What it checks:
#   - doc2slide's pure helpers pass their node unit tests
#   - every HTML page loads to </html> with no uncaught browser exception
#   - each Sketchbook sheet reaches #sheet[data-state="ready"], publishes a pixel
#     hash (?probe=1) and survives ?smoke=N extra seeds with zero errors
#   - the Sketchbook hub reaches #tiles[data-state="ready"]
#   - DrawMe's ?debug=1 probes all pass (#probes[data-pass="true"])
set -euo pipefail
cd "$(dirname "$0")"

CHROME="${CHROME:-$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)}"
PORT="${PORT:-8907}"
SMOKE="${SMOKE:-20}"
TMP="$(mktemp -d)"
SERVER_PID=""
trap '[ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null; rm -rf "$TMP"' EXIT

PASS=0 FAIL=0
ok()  { PASS=$((PASS + 1)); printf 'PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL + 1)); printf 'FAIL  %s\n' "$1"; }

# ── unit tests ──
if node --test doc2slide/pure.test.mjs >"$TMP/node-test.log" 2>&1; then
  ok "doc2slide unit tests"
else
  bad "doc2slide unit tests — node --test doc2slide/pure.test.mjs"
  tail -20 "$TMP/node-test.log"
fi

# ── pages, in a real (headless) Chrome ──
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
for _ in $(seq 40); do
  if curl -sf -o /dev/null "http://127.0.0.1:$PORT/index.html"; then break; fi
  sleep 0.25
done
BASE="http://127.0.0.1:$PORT"

# render <path?query> <virtual-time-budget-ms>: DOM to $TMP/dom.html, console to $TMP/console.log
render() {
  "$CHROME" --headless=new --disable-gpu --no-first-run --hide-scrollbars \
    --enable-logging=stderr --v=0 --virtual-time-budget="${2:-8000}" \
    --dump-dom "$BASE/$1" >"$TMP/dom.html" 2>"$TMP/console.log" || true
}

# page <path?query> <budget> <label> [+required-regex | -forbidden-regex ...]
# NOTE: --dump-dom HTML-escapes attribute values, so JSON attrs read &quot;errors&quot;:[]
page() {
  local path="$1" budget="$2" label="$3" spec
  shift 3
  render "$path" "$budget"
  local problems=()
  if ! grep -q '</html>' "$TMP/dom.html"; then problems+=("page did not load"); fi
  if grep -q 'Uncaught' "$TMP/console.log"; then
    problems+=("uncaught exception: $(grep -m1 -o 'Uncaught[^,]*' "$TMP/console.log")")
  fi
  for spec in "$@"; do
    case "$spec" in
      +*) if ! grep -qE -- "${spec:1}" "$TMP/dom.html"; then problems+=("missing: ${spec:1}"); fi ;;
      -*) if grep -qE -- "${spec:1}" "$TMP/dom.html"; then problems+=("found: ${spec:1}"); fi ;;
    esac
  done
  if [ "${#problems[@]}" -eq 0 ]; then ok "$label"; else bad "$label — ${problems[*]}"; fi
}

page "index.html"           8000  "landing page"
page "doc2slide/index.html" 8000  "doc2slide"
page "story/index.html"     8000  "Am I in a Story?"
page "img/index.html"       8000  "Image Anatomy Explorer"
page "drawme/index.html?debug=1" 12000 "DrawMe probes" \
  '+id="probes"[^>]*data-pass="true"' '-data-pass="false"'
page "faces/index.html?seed=1" 15000 "Sketchbook hub tiles ready" \
  '+id="tiles"[^>]*data-state="ready"'
for sheet in faces figures animals tattoo space creatures mix; do
  page "faces/$sheet.html?seed=1&probe=1&smoke=$SMOKE" 20000 \
    "Sketchbook $sheet: ready, hashed, $SMOKE smoke seeds clean" \
    '+id="sheet"[^>]*data-state="ready"' \
    '+data-hash="[0-9a-f]+"' \
    '+&quot;errors&quot;:\[\]'
done

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
