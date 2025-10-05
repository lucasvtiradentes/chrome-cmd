#!/bin/bash

# Ensure mediator is running before executing CLI commands

MEDIATOR_URL="http://localhost:8765"
MAX_RETRIES=3
RETRY_DELAY=1

# Function to check if mediator is running
check_mediator() {
  curl -s -f "$MEDIATOR_URL/ping" > /dev/null 2>&1
  return $?
}

# Try to ping mediator
for i in $(seq 1 $MAX_RETRIES); do
  if check_mediator; then
    exit 0
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    sleep $RETRY_DELAY
  fi
done

# Mediator not responding
echo "Error: Mediator not responding. Please reload the Chrome extension." >&2
exit 1
