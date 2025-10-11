#!/bin/bash

# Bundle chrome-extension into CLI package
# This script copies the built chrome extension into the CLI package
# so it can be distributed together with the npm package

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_ROOT="$(dirname "$SCRIPT_DIR")"
CHROME_EXT_DIR="$CLI_ROOT/../chrome-extension"
CHROME_EXT_DIST="$CHROME_EXT_DIR/dist"
CLI_EXTENSION_DIR="$CLI_ROOT/chrome-extension"

echo "📦 Bundling chrome-extension into CLI package..."

# Check if chrome-extension dist exists
if [ ! -d "$CHROME_EXT_DIST" ]; then
  echo "❌ Error: Chrome extension not built yet"
  echo "   Expected: $CHROME_EXT_DIST"
  echo "   Please run 'pnpm build' in packages/chrome-extension first"
  exit 1
fi

# Remove existing chrome-extension directory in CLI
if [ -d "$CLI_EXTENSION_DIR" ]; then
  echo "🗑️  Removing old chrome-extension directory..."
  rm -rf "$CLI_EXTENSION_DIR"
fi

# Copy chrome-extension dist to CLI package
echo "📋 Copying chrome-extension build to CLI package..."
cp -r "$CHROME_EXT_DIST" "$CLI_EXTENSION_DIR"

echo "✅ Chrome extension bundled successfully!"
echo "   Location: $CLI_EXTENSION_DIR"
echo "   Files:"
ls -lh "$CLI_EXTENSION_DIR" | tail -n +2
