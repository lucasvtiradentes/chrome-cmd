#!/bin/bash

# Post-build script to create the native messaging host wrapper

echo "📦 Creating native messaging host wrapper..."

# Get Node path
NODE_PATH=$(which node)

if [ -z "$NODE_PATH" ]; then
  echo "❌ Error: Node not found in PATH"
  exit 1
fi

echo "✅ Found Node at: $NODE_PATH"

# Create wrapper script
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

NODE_PATH="NODE_PATH_PLACEHOLDER"

if [ ! -f "$NODE_PATH" ]; then
  echo "[$(date)] ERROR: Node not found at $NODE_PATH" >> "$LOG_FILE"
  exit 1
fi

echo "[$(date)] Executing $NODE_PATH $DIR/mediator-host.js" >> "$LOG_FILE"
exec "$NODE_PATH" "$DIR/mediator-host.js" 2>> "$LOG_FILE"
EOF

# Replace placeholder with actual Node path
sed -i "s|NODE_PATH_PLACEHOLDER|$NODE_PATH|g" dist/native-host/host.sh

# Make executable
chmod +x dist/native-host/host.sh

echo "✅ Wrapper created at dist/native-host/host.sh"
echo "   Using Node: $NODE_PATH"
