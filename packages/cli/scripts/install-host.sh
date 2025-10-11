#!/bin/bash

# Script to install Native Messaging Host for Chrome CLI

set -e

# Constants - must match @chrome-cmd/shared
NATIVE_APP_NAME="com.chrome_cli.native"
NATIVE_MANIFEST_FILENAME="${NATIVE_APP_NAME}.json"

echo "🔧 Installing Chrome CLI Native Messaging Host..."

# Get the absolute path to the project
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
HOST_PATH="$PROJECT_DIR/dist/native-host/host.sh"

# Check if dist exists
if [ ! -f "$HOST_PATH" ]; then
    echo "❌ Error: $HOST_PATH not found"
    echo "Please run 'npm run build' first"
    exit 1
fi

# Make host executable
chmod +x "$HOST_PATH"

# Get Chrome extension ID
echo ""
echo "📋 Please provide your Chrome Extension ID"
echo "   (Find it at chrome://extensions/)"
read -p "Extension ID: " EXTENSION_ID

if [ -z "$EXTENSION_ID" ]; then
    echo "❌ Extension ID is required"
    exit 1
fi

# Detect OS and set manifest path
OS="$(uname -s)"
case "$OS" in
    Linux*)
        MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
        ;;
    Darwin*)
        MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
        ;;
    *)
        echo "❌ Unsupported OS: $OS"
        exit 1
        ;;
esac

# Create directory
mkdir -p "$MANIFEST_DIR"

# Create manifest
MANIFEST_PATH="$MANIFEST_DIR/$NATIVE_MANIFEST_FILENAME"

cat > "$MANIFEST_PATH" << EOF
{
  "name": "$NATIVE_APP_NAME",
  "description": "Chrome CLI Native Messaging Host",
  "path": "$HOST_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo ""
echo "✅ Native Messaging Host installed successfully!"
echo ""
echo "📄 Manifest location: $MANIFEST_PATH"
echo "🔧 Host location: $HOST_PATH"
echo "🆔 Extension ID: $EXTENSION_ID"
echo ""
echo "Next steps:"
echo "1. Reload the Chrome extension at chrome://extensions/"
echo "2. Test with: npm run dev -- tabs list"
echo ""
