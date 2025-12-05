#!/bin/bash

# Package script for Lee-Su-Threads Chrome Extension

set -e

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')

echo "📦 Packaging Lee-Su-Threads v${VERSION}..."

# Create dist directory if it doesn't exist
mkdir -p dist-zip

# Create zip file (excluding unnecessary files)
zip -r "dist-zip/lee-su-threads-v${VERSION}.zip" . \
  -x "*.git*" \
  -x "*.DS_Store" \
  -x "dist-zip/*" \
  -x "scripts/*" \
  -x "tmp/*" \
  -x "*.md" \
  -x "*.sh"

echo "✅ Created dist-zip/lee-su-threads-v${VERSION}.zip"
echo "📊 Size: $(du -h dist-zip/lee-su-threads-v${VERSION}.zip | cut -f1)"
