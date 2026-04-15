#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CAST="$ROOT_DIR/demo.cast"
GIF="$ROOT_DIR/demo.gif"
TAG="demo-assets"
REPO="afrontend/fp-space"

echo "==> Recording autoplay..."
asciinema rec "$CAST" \
  --command "node $SCRIPT_DIR/autoplay.js" \
  --window-size 36x20 \
  --overwrite

echo "==> Converting to GIF..."
agg "$CAST" "$GIF" --speed 1.5 --theme monokai

echo "==> Uploading to GitHub Releases..."
# Ensure the tag exists
gh release view "$TAG" --repo "$REPO" > /dev/null 2>&1 \
  || gh release create "$TAG" --repo "$REPO" \
       --title "Demo Assets" \
       --notes "Automated demo GIF assets" \
       --prerelease

gh release upload "$TAG" "$GIF" --repo "$REPO" --clobber

GIF_URL="https://github.com/$REPO/releases/download/$TAG/demo.gif"
echo "==> GIF URL: $GIF_URL"

echo "==> Updating README.md..."
if grep -q "demo.gif" "$ROOT_DIR/README.md"; then
  sed -i '' "s|https://.*demo\.gif|$GIF_URL|g" "$ROOT_DIR/README.md"
else
  # Insert demo image right after the first h1 line
  sed -i '' "1a\\
\\
![Demo](${GIF_URL})
" "$ROOT_DIR/README.md"
fi

echo "==> Done!"
