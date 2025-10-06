#!/bin/bash

# Post-build script to create the native messaging host wrapper

echo "📦 Creating native messaging host wrapper..."

# Create wrapper script that detects node at runtime
cat > dist/native-host/host.sh << 'EOF'
#!/bin/bash

# Native Messaging Host Wrapper - Runs Mediator

LOG_FILE="$HOME/.chrome-cli-wrapper.log"
echo "[$(date)] Wrapper started" >> "$LOG_FILE"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "[$(date)] DIR=$DIR" >> "$LOG_FILE"

if [ ! -f "$DIR/mediator-host.js" ]; then
  echo "[$(date)] ERROR: mediator-host.js not found" >> "$LOG_FILE"
  exit 1
fi

# Detect node at runtime - try multiple methods
# Chrome Native Messaging doesn't inherit shell PATH, so we need to search common locations
NODE_PATH=""

# Method 1: Try common nvm path
if [ -f "$HOME/.nvm/versions/node/$(ls -t $HOME/.nvm/versions/node/ 2>/dev/null | head -1)/bin/node" ]; then
  NODE_PATH="$HOME/.nvm/versions/node/$(ls -t $HOME/.nvm/versions/node/ | head -1)/bin/node"
# Method 2: Try system node
elif [ -f "/usr/bin/node" ]; then
  NODE_PATH="/usr/bin/node"
elif [ -f "/usr/local/bin/node" ]; then
  NODE_PATH="/usr/local/bin/node"
# Method 3: Try which (might work in some environments)
else
  NODE_PATH=$(which node 2>/dev/null)
fi

if [ -z "$NODE_PATH" ] || [ ! -f "$NODE_PATH" ]; then
  echo "[$(date)] ERROR: Node not found. Tried:" >> "$LOG_FILE"
  echo "[$(date)]   - NVM path: $HOME/.nvm/versions/node/*/bin/node" >> "$LOG_FILE"
  echo "[$(date)]   - System: /usr/bin/node, /usr/local/bin/node" >> "$LOG_FILE"
  echo "[$(date)]   - which: $(which node 2>&1)" >> "$LOG_FILE"
  exit 1
fi

echo "[$(date)] Using Node: $NODE_PATH" >> "$LOG_FILE"
echo "[$(date)] Executing $NODE_PATH $DIR/mediator-host.js" >> "$LOG_FILE"
exec "$NODE_PATH" "$DIR/mediator-host.js" 2>> "$LOG_FILE"
EOF

# Make executable
chmod +x dist/native-host/host.sh

echo "✅ Wrapper created at dist/native-host/host.sh"
echo "   Node will be detected at runtime"
