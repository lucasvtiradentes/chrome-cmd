#!/bin/bash

echo "🔧 Updating Native Messaging Host manifest..."

cat > ~/.config/google-chrome/NativeMessagingHosts/com.chrome_cli.native.json << 'MANIFEST_EOF'
{
  "name": "com.chrome_cli.native",
  "description": "Chrome CLI Native Messaging Host",
  "path": "/home/lucas/_custom/repos/github_lucasvtiradentes/cli-to-browser/packages/chrome-cli/dist/native-host/host.sh",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://gepjnibmadcdhppipakehfcnobiaenhi/"
  ]
}
MANIFEST_EOF

echo "✅ Manifest updated!"
echo ""
cat ~/.config/google-chrome/NativeMessagingHosts/com.chrome_cli.native.json
echo ""
echo "Next steps:"
echo "1. Reload the Chrome extension at chrome://extensions/"
echo "2. Check logs: cat ~/.chrome-cli-host.log"
