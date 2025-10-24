#!/usr/bin/env tsx

import { chmodSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILES_CONFIG } from '../src/shared/configs/files.config.js';
import { PathHelper } from '../src/shared/utils/helpers/path.helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');
const bridgeDir = join(distDir, FILES_CONFIG.BRIDGE_FOLDER);
const wrapperLogFilename = basename(FILES_CONFIG.BRIDGE_WRAPPER_LOG_FILE);

function ensureDirectoryExists(): void {
  PathHelper.ensureDir(join(bridgeDir, 'dummy'));
}

function generateLinuxMacOSWrapper(): void {
  const hostShContent = `#!/bin/bash

DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"

# Create logs directory relative to package installation
LOGS_DIR="$DIR/../../logs"
mkdir -p "$LOGS_DIR"

LOG_FILE="$LOGS_DIR/${wrapperLogFilename}"
echo "[$(date)] Wrapper started" >> "$LOG_FILE"
echo "[$(date)] DIR=$DIR" >> "$LOG_FILE"

if [ ! -f "$DIR/../src/${FILES_CONFIG.BRIDGE_FOLDER}/process.js" ]; then
  echo "[$(date)] ERROR: bridge process.js not found" >> "$LOG_FILE"
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
echo "[$(date)] Executing $NODE_PATH $DIR/../src/${FILES_CONFIG.BRIDGE_FOLDER}/process.js" >> "$LOG_FILE"
exec "$NODE_PATH" "$DIR/../src/${FILES_CONFIG.BRIDGE_FOLDER}/process.js" 2>> "$LOG_FILE"
`;

  const hostShPath = join(bridgeDir, 'host.sh');
  writeFileSync(hostShPath, hostShContent);

  try {
    chmodSync(hostShPath, 0o755);
  } catch (_error) {}

  console.log(`✅ Linux/macOS wrapper created: dist/${FILES_CONFIG.BRIDGE_FOLDER}/host.sh`);
}

function generateWindowsWrapper(): void {
  const hostBatContent = `@echo off

setlocal

set "DIR=%~dp0"

REM Create logs directory relative to package installation
set "LOGS_DIR=%DIR%..\\..\\logs"
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

set "LOG_FILE=%LOGS_DIR%\\${wrapperLogFilename}"
echo [%date% %time%] Wrapper started >> "%LOG_FILE%"
echo [%date% %time%] DIR=%DIR% >> "%LOG_FILE%"

if not exist "%DIR%..\\src\\${FILES_CONFIG.BRIDGE_FOLDER}\\process.js" (
  echo [%date% %time%] ERROR: bridge process.js not found >> "%LOG_FILE%"
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
echo [%date% %time%] Executing "%NODE_PATH%" "%DIR%..\\src\\${FILES_CONFIG.BRIDGE_FOLDER}\\process.js" >> "%LOG_FILE%"

"%NODE_PATH%" "%DIR%..\\src\\${FILES_CONFIG.BRIDGE_FOLDER}\\process.js" 2>> "%LOG_FILE%"
`;

  const hostBatPath = join(bridgeDir, 'host.bat');
  writeFileSync(hostBatPath, hostBatContent);

  console.log(`✅ Windows wrapper created: dist/${FILES_CONFIG.BRIDGE_FOLDER}/host.bat`);
}

function printSummary(): void {
  console.log('');
  console.log('🎯 Native messaging host wrappers ready for all platforms!');
  console.log('   - Linux/macOS: host.sh');
  console.log('   - Windows: host.bat');
  console.log('   Node will be detected at runtime on each platform');
  console.log('');
}

function main(): void {
  console.log('📦 Post-build: Creating native messaging host wrappers...');
  console.log('');

  ensureDirectoryExists();
  generateLinuxMacOSWrapper();
  generateWindowsWrapper();
  printSummary();
}

main();
