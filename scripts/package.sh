#!/bin/bash

# Package script for Lee-Su-Threads Extension (Chrome and Firefox)

set -e

# Get the script's directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')

echo "📦 Packaging Lee-Su-Threads v${VERSION}..."

# Create dist directory if it doesn't exist
mkdir -p dist-zip

# Files to include in the extension
FILES=(
  "manifest.json"
  "background.js"
  "content.js"
  "injected.js"
  "popup.html"
  "popup.js"
  "styles.css"
  "icons"
)

# Create a temporary directory for building
TEMP_DIR=$(mktemp -d)
trap "rm -rf '$TEMP_DIR'" EXIT

# ========== Chrome Build ==========
echo ""
echo "🌐 Building Chrome extension..."

CHROME_DIR="$TEMP_DIR/chrome"
mkdir -p "$CHROME_DIR"

# Copy files for Chrome
for file in "${FILES[@]}"; do
  cp -r "$file" "$CHROME_DIR/"
done

# Create Chrome zip
cd "$CHROME_DIR"
zip -r "$PROJECT_ROOT/dist-zip/lee-su-threads-chrome-v${VERSION}.zip" . -x "*.DS_Store"
cd "$PROJECT_ROOT"

echo "✅ Created dist-zip/lee-su-threads-chrome-v${VERSION}.zip"
echo "📊 Size: $(du -h dist-zip/lee-su-threads-chrome-v${VERSION}.zip | cut -f1)"

# ========== Firefox Build ==========
echo ""
echo "🦊 Building Firefox extension..."

FIREFOX_DIR="$TEMP_DIR/firefox"
mkdir -p "$FIREFOX_DIR"

# Copy files for Firefox (excluding Chrome manifest)
for file in "${FILES[@]}"; do
  if [ "$file" != "manifest.json" ]; then
    cp -r "$file" "$FIREFOX_DIR/"
  fi
done

# Copy Firefox-specific manifest
cp "manifest.firefox.json" "$FIREFOX_DIR/manifest.json"

# Create Firefox zip (Firefox uses .xpi extension, but .zip works too)
cd "$FIREFOX_DIR"
zip -r "$PROJECT_ROOT/dist-zip/lee-su-threads-firefox-v${VERSION}.zip" . -x "*.DS_Store"
cd "$PROJECT_ROOT"

echo "✅ Created dist-zip/lee-su-threads-firefox-v${VERSION}.zip"
echo "📊 Size: $(du -h dist-zip/lee-su-threads-firefox-v${VERSION}.zip | cut -f1)"

echo ""
echo "🎉 All builds complete!"
echo ""
echo "Chrome:  dist-zip/lee-su-threads-chrome-v${VERSION}.zip"
echo "Firefox: dist-zip/lee-su-threads-firefox-v${VERSION}.zip"
