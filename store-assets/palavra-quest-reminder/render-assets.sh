#!/bin/zsh
set -euo pipefail

ASSET_DIR="${0:A:h}"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PALAVRA_RENDER_PROFILE="$(mktemp -d /private/tmp/palavra-store-render.XXXXXX)"

cleanup() {
  rm -rf "$PALAVRA_RENDER_PROFILE"
}
trap cleanup EXIT

render() {
  local size="$1"
  local asset="$2"
  local output="$3"

  "$CHROME_BIN" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --no-first-run \
    --force-device-scale-factor=1 \
    --user-data-dir="$PALAVRA_RENDER_PROFILE" \
    --window-size="$size" \
    --virtual-time-budget=3500 \
    --screenshot="$ASSET_DIR/$output" \
    "http://127.0.0.1:8765/store-assets/palavra-quest-reminder/source/render.html?asset=$asset"
}

render "1280,800" home "01-three-minutes-real-progress-1280x800.png"
render "1280,800" quest "02-smart-adaptive-practice-1280x800.png"
render "1280,800" reminder "03-friendly-daily-reminder-1280x800.png"
render "440,280" promo "small-promo-tile-440x280.png"

