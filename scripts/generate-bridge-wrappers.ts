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
  const bridgeShContent = `#!/bin/bash

DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"

LOGS_DIR="$DIR/../../logs"
mkdir -p "$LOGS_DIR"

LOG_FILE="$LOGS_DIR/${wrapperLogFilename}"
echo "[$(date)] Wrapper started" >> "$LOG_FILE"
echo "[$(date)] DIR=$DIR" >> "$LOG_FILE"

if [ ! -f "$DIR/process.js" ]; then
  echo "[$(date)] ERROR: bridge process.js not found" >> "$LOG_FILE"
  exit 1
fi

NODE_PATH=""

if [ "$(uname)" = "Darwin" ]; then
  if [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST_NODE=$(ls -t "$HOME/.nvm/versions/node/" 2>/dev/null | head -1)
    if [ -n "$LATEST_NODE" ] && [ -f "$HOME/.nvm/versions/node/$LATEST_NODE/bin/node" ]; then
      NODE_PATH="$HOME/.nvm/versions/node/$LATEST_NODE/bin/node"
    fi
  fi

  if [ -z "$NODE_PATH" ]; then
    for path in "/usr/local/bin/node" "/opt/homebrew/bin/node" "/usr/bin/node"; do
      if [ -f "$path" ]; then
        NODE_PATH="$path"
        break
      fi
    done
  fi
else
  if [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST_NODE=$(ls -t "$HOME/.nvm/versions/node/" 2>/dev/null | head -1)
    if [ -n "$LATEST_NODE" ] && [ -f "$HOME/.nvm/versions/node/$LATEST_NODE/bin/node" ]; then
      NODE_PATH="$HOME/.nvm/versions/node/$LATEST_NODE/bin/node"
    fi
  fi

  if [ -z "$NODE_PATH" ]; then
    for path in "/usr/bin/node" "/usr/local/bin/node"; do
      if [ -f "$path" ]; then
        NODE_PATH="$path"
        break
      fi
    done
  fi
fi

if [ -z "$NODE_PATH" ]; then
  NODE_PATH=$(which node 2>/dev/null)
fi

if [ -z "$NODE_PATH" ] || [ ! -f "$NODE_PATH" ]; then
  echo "[$(date)] ERROR: Node not found. Tried:" >> "$LOG_FILE"
  echo "[$(date)]   - NVM path: $HOME/.nvm/versions/node/*/bin/node" >> "$LOG_FILE"
  if [ "$(uname)" = "Darwin" ]; then
    echo "[$(date)]   - macOS paths: /opt/homebrew/bin/node, /usr/local/bin/node, /usr/bin/node" >> "$LOG_FILE"
  else
    echo "[$(date)]   - Linux paths: /usr/bin/node, /usr/local/bin/node" >> "$LOG_FILE"
  fi
  echo "[$(date)]   - which: $(which node 2>&1)" >> "$LOG_FILE"
  exit 1
fi

echo "[$(date)] Using Node: $NODE_PATH" >> "$LOG_FILE"
echo "[$(date)] Executing $NODE_PATH $DIR/process.js" >> "$LOG_FILE"
exec "$NODE_PATH" "$DIR/process.js" 2>> "$LOG_FILE"
`;

  const bridgeShPath = join(bridgeDir, 'bridge.sh');
  writeFileSync(bridgeShPath, bridgeShContent);

  try {
    chmodSync(bridgeShPath, 0o755);
  } catch (_error) {}

  console.log(`✅ Linux/macOS wrapper created: dist/${FILES_CONFIG.BRIDGE_FOLDER}/bridge.sh`);
}

function generateWindowsWrapper(): void {
  const bridgeBatContent = `@echo off

setlocal

set "DIR=%~dp0"

REM Create logs directory relative to package installation
set "LOGS_DIR=%DIR%..\\..\\logs"
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

set "LOG_FILE=%LOGS_DIR%\\${wrapperLogFilename}"
echo [%date% %time%] Wrapper started >> "%LOG_FILE%"
echo [%date% %time%] DIR=%DIR% >> "%LOG_FILE%"

if not exist "%DIR%process.js" (
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
echo [%date% %time%] Executing "%NODE_PATH%" "%DIR%process.js" >> "%LOG_FILE%"

"%NODE_PATH%" "%DIR%process.js" 2>> "%LOG_FILE%"
`;

  const bridgeBatPath = join(bridgeDir, 'bridge.bat');
  writeFileSync(bridgeBatPath, bridgeBatContent);

  console.log(`✅ Windows wrapper created: dist/${FILES_CONFIG.BRIDGE_FOLDER}/bridge.bat`);
}

function printSummary(): void {
  console.log('');
  console.log('🎯 Bridge wrappers ready for all platforms!');
  console.log('   - Linux/macOS: bridge.sh');
  console.log('   - Windows: bridge.bat');
  console.log('   Node will be detected at runtime on each platform');
  console.log('');
}

function main(): void {
  console.log('📦 Post-build: Creating bridge wrappers...');
  console.log('');

  ensureDirectoryExists();
  generateLinuxMacOSWrapper();
  generateWindowsWrapper();
  printSummary();
}

main();
