#!/usr/bin/env tsx

/**
 * Post-build script to create native messaging host wrappers (.sh and .bat)
 */

import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIATOR_WRAPPER_LOG_FILE } from '../src/shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');
const nativeHostDir = join(distDir, 'native-host');

console.log('📦 Post-build: Creating native messaging host wrappers...');
console.log('');

// Ensure native-host directory exists
if (!existsSync(nativeHostDir)) {
  mkdirSync(nativeHostDir, { recursive: true });
}

// ============================================================================
// Linux/macOS wrapper (host.sh)
// ============================================================================

const hostShContent = `#!/bin/bash

# Native Messaging Host Wrapper - Runs Mediator
# Cross-platform wrapper for Linux/macOS

LOG_FILE="${MEDIATOR_WRAPPER_LOG_FILE}"
echo "[$(date)] Wrapper started" >> "$LOG_FILE"

DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
echo "[$(date)] DIR=$DIR" >> "$LOG_FILE"

if [ ! -f "$DIR/../cli/native-host/mediator-host.js" ]; then
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
echo "[$(date)] Executing $NODE_PATH $DIR/../cli/native-host/mediator-host.js" >> "$LOG_FILE"
exec "$NODE_PATH" "$DIR/../cli/native-host/mediator-host.js" 2>> "$LOG_FILE"
`;

const hostShPath = join(nativeHostDir, 'host.sh');
writeFileSync(hostShPath, hostShContent);

// Make executable on Unix systems
try {
  chmodSync(hostShPath, 0o755);
} catch (_error) {
  // Ignore chmod errors on Windows
}

console.log('✅ Linux/macOS wrapper created: dist/native-host/host.sh');

// ============================================================================
// Windows wrapper (host.bat)
// ============================================================================

// Windows version uses %USERPROFILE% which is resolved at runtime
const hostBatContent = `@echo off
REM Native Messaging Host Wrapper - Runs Mediator
REM Cross-platform wrapper for Windows

setlocal

set "LOG_FILE=%USERPROFILE%\\.chrome-cli-wrapper.log"
set "DIR=%~dp0"

echo [%date% %time%] Wrapper started >> "%LOG_FILE%"
echo [%date% %time%] DIR=%DIR% >> "%LOG_FILE%"

if not exist "%DIR%..\\cli\\native-host\\mediator-host.js" (
  echo [%date% %time%] ERROR: mediator-host.js not found >> "%LOG_FILE%"
  exit /b 1
)

REM Try to find node.exe
set "NODE_PATH="

REM Method 1: Try node from PATH
where node.exe >nul 2>&1
if %ERRORLEVEL% == 0 (
  for /f "delims=" %%i in ('where node.exe') do set "NODE_PATH=%%i"
)

REM Method 2: Try common installation paths
if "%NODE_PATH%"=="" (
  if exist "%ProgramFiles%\\nodejs\\node.exe" (
    set "NODE_PATH=%ProgramFiles%\\nodejs\\node.exe"
  )
)

if "%NODE_PATH%"=="" (
  if exist "%ProgramFiles(x86)%\\nodejs\\node.exe" (
    set "NODE_PATH=%ProgramFiles(x86)%\\nodejs\\node.exe"
  )
)

if "%NODE_PATH%"=="" (
  echo [%date% %time%] ERROR: Node not found >> "%LOG_FILE%"
  exit /b 1
)

echo [%date% %time%] Using Node: %NODE_PATH% >> "%LOG_FILE%"
echo [%date% %time%] Executing "%NODE_PATH%" "%DIR%..\\cli\\native-host\\mediator-host.js" >> "%LOG_FILE%"

"%NODE_PATH%" "%DIR%..\\cli\\native-host\\mediator-host.js" 2>> "%LOG_FILE%"
`;

const hostBatPath = join(nativeHostDir, 'host.bat');
writeFileSync(hostBatPath, hostBatContent);

console.log('✅ Windows wrapper created: dist/native-host/host.bat');
console.log('');
console.log('🎯 Native messaging host wrappers ready for all platforms!');
console.log('   - Linux/macOS: host.sh');
console.log('   - Windows: host.bat');
console.log('   Node will be detected at runtime on each platform');
console.log('');
