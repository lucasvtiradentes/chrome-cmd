#!/usr/bin/env tsx

import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NATIVE_HOST_FOLDER } from '../src/shared/constants.js';
import { MEDIATOR_WRAPPER_LOG_FILE } from '../src/shared/constants-node.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');
const nativeHostDir = join(distDir, NATIVE_HOST_FOLDER);

console.log('📦 Post-build: Creating native messaging host wrappers...');
console.log('');

// Ensure directory exists
if (!existsSync(nativeHostDir)) {
  mkdirSync(nativeHostDir, { recursive: true });
}

const hostShContent = `#!/bin/bash

LOG_FILE="${MEDIATOR_WRAPPER_LOG_FILE}"
echo "[$(date)] Wrapper started" >> "$LOG_FILE"

DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
echo "[$(date)] DIR=$DIR" >> "$LOG_FILE"

if [ ! -f "$DIR/../cli/${NATIVE_HOST_FOLDER}/mediator-host.js" ]; then
  echo "[$(date)] ERROR: mediator-host.js not found" >> "$LOG_FILE"
  exit 1
fi

# Detect node at runtime - try multiple methods
# Chrome Native Messaging doesn't inherit shell PATH, so we need to search common locations
NODE_PATH=""
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
echo "[$(date)] Executing $NODE_PATH $DIR/../cli/${NATIVE_HOST_FOLDER}/mediator-host.js" >> "$LOG_FILE"
exec "$NODE_PATH" "$DIR/../cli/${NATIVE_HOST_FOLDER}/mediator-host.js" 2>> "$LOG_FILE"
`;

const hostShPath = join(nativeHostDir, 'host.sh');
writeFileSync(hostShPath, hostShContent);

try {
  chmodSync(hostShPath, 0o755);
} catch (_error) {}

console.log(`✅ Linux/macOS wrapper created: dist/${NATIVE_HOST_FOLDER}/host.sh`);

const hostBatContent = `@echo off

setlocal

set "LOG_FILE=%USERPROFILE%\\.chrome-cli-wrapper.log"
set "DIR=%~dp0"

echo [%date% %time%] Wrapper started >> "%LOG_FILE%"
echo [%date% %time%] DIR=%DIR% >> "%LOG_FILE%"

if not exist "%DIR%..\\cli\\${NATIVE_HOST_FOLDER}\\mediator-host.js" (
  echo [%date% %time%] ERROR: mediator-host.js not found >> "%LOG_FILE%"
  exit /b 1
)

set "NODE_PATH="
where node.exe >nul 2>&1
if %ERRORLEVEL% == 0 (
  for /f "delims=" %%i in ('where node.exe') do set "NODE_PATH=%%i"
)

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
echo [%date% %time%] Executing "%NODE_PATH%" "%DIR%..\\cli\\${NATIVE_HOST_FOLDER}\\mediator-host.js" >> "%LOG_FILE%"

"%NODE_PATH%" "%DIR%..\\cli\\${NATIVE_HOST_FOLDER}\\mediator-host.js" 2>> "%LOG_FILE%"
`;

const hostBatPath = join(nativeHostDir, 'host.bat');
writeFileSync(hostBatPath, hostBatContent);

console.log(`✅ Windows wrapper created: dist/${NATIVE_HOST_FOLDER}/host.bat`);
console.log('');
console.log('🎯 Native messaging host wrappers ready for all platforms!');
console.log('   - Linux/macOS: host.sh');
console.log('   - Windows: host.bat');
console.log('   Node will be detected at runtime on each platform');
console.log('');
