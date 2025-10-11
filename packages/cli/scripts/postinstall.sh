#!/bin/bash

# Post-install script for chrome-cmd
# Shows the path to the bundled Chrome extension

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(dirname "$SCRIPT_DIR")"
EXTENSION_PATH="$PACKAGE_ROOT/chrome-extension"

# Only show message if chrome-extension directory exists
# (it won't exist during development/local builds)
if [ -d "$EXTENSION_PATH" ]; then
  echo ""
  echo "╔═══════════════════════════════════════════════════════════════════════╗"
  echo "║                  🎉 Chrome CMD installed successfully!                ║"
  echo "╚═══════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "📦 Chrome Extension Location:"
  echo "   $EXTENSION_PATH"
  echo ""
  echo "🚀 Next Steps:"
  echo ""
  echo "   1. Open Chrome and navigate to: chrome://extensions/"
  echo "   2. Enable \"Developer mode\" (toggle in top-right)"
  echo "   3. Click \"Load unpacked\" and select the path above"
  echo "   4. Copy the Extension ID from the loaded extension"
  echo "   5. Run: chrome-cmd host install"
  echo ""
  echo "📖 Full documentation: https://github.com/lucasvtiradentes/chrome-cmd"
  echo ""
fi
