#!/usr/bin/env tsx

/**
 * Post-build script to:
 * 1. Create native messaging host wrappers (.sh and .bat)
 * 2. Compile TypeScript scripts to JavaScript for npm distribution
 * Cross-platform: Works on Linux, macOS, and Windows
 */

import { writeFileSync, chmodSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist', 'native-host');
const distScriptsDir = join(__dirname, '..', 'dist', 'scripts');
const scriptsDir = __dirname;

// Ensure directories exist
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}
if (!existsSync(distScriptsDir)) {
  mkdirSync(distScriptsDir, { recursive: true });
}

console.log('📦 Post-build: Creating wrappers and compiling scripts...');
console.log('');

// ============================================================================
// 1. Compile TypeScript scripts to JavaScript
// ============================================================================

console.log('1️⃣  Compiling scripts to JavaScript...');

const scriptFiles = readdirSync(scriptsDir)
  .filter(file => file.endsWith('.ts') && file !== 'post-build.ts' && file !== 'bundle-extension.ts' && file !== 'bundle-shared.ts' && file !== 'prepare-publish.ts');

scriptFiles.forEach(file => {
  const content = readFileSync(join(scriptsDir, file), 'utf8');
  // Remove shebang and TypeScript-specific syntax for simple conversion
  const jsContent = content
    .replace(/^#!.*\n/, '') // Remove shebang
    .replace(/import\s+type\s+.*\n/g, '') // Remove type imports
    .replace(/:\s*\w+(\[\])?(\s*=|\s*\)|\s*,|\s*;)/g, '$2') // Remove type annotations
    .replace(/\):\s*\w+\s*\{/g, ') {'); // Remove return type annotations

  // For postinstall, use .js extension; for others use .mjs
  const extension = file === 'postinstall.ts' ? '.js' : '.mjs';
  const outFile = file.replace('.ts', extension);
  const outPath = join(distScriptsDir, outFile);

  // Add shebang back
  writeFileSync(outPath, `#!/usr/bin/env node\n${jsContent}`);

  // Make executable
  try {
    chmodSync(outPath, 0o755);
  } catch (error) {
    // Ignore chmod errors on Windows
  }

  console.log(`  ✅ ${outFile}`);
});

console.log('');
console.log('2️⃣  Creating native messaging host wrappers...');

// ============================================================================
// Linux/macOS wrapper (host.sh)
// ============================================================================

const hostShContent = `#!/bin/bash

# Native Messaging Host Wrapper - Runs Mediator
# Cross-platform wrapper for Linux/macOS

LOG_FILE="$HOME/.chrome-cli-wrapper.log"
echo "[$(date)] Wrapper started" >> "$LOG_FILE"

DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
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
`;

const hostShPath = join(distDir, 'host.sh');
writeFileSync(hostShPath, hostShContent);

// Make executable on Unix systems
try {
  chmodSync(hostShPath, 0o755);
} catch (error) {
  // Ignore chmod errors on Windows
}

console.log('✅ Linux/macOS wrapper created: dist/native-host/host.sh');

// ============================================================================
// Windows wrapper (host.bat)
// ============================================================================

const hostBatContent = `@echo off
REM Native Messaging Host Wrapper - Runs Mediator
REM Cross-platform wrapper for Windows

setlocal

set "LOG_FILE=%USERPROFILE%\\.chrome-cli-wrapper.log"
set "DIR=%~dp0"

echo [%date% %time%] Wrapper started >> "%LOG_FILE%"
echo [%date% %time%] DIR=%DIR% >> "%LOG_FILE%"

if not exist "%DIR%mediator-host.js" (
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
echo [%date% %time%] Executing "%NODE_PATH%" "%DIR%mediator-host.js" >> "%LOG_FILE%"

"%NODE_PATH%" "%DIR%mediator-host.js" 2>> "%LOG_FILE%"
`;

const hostBatPath = join(distDir, 'host.bat');
writeFileSync(hostBatPath, hostBatContent);

console.log('✅ Windows wrapper created: dist/native-host/host.bat');
console.log('');
console.log('🎯 Native messaging host wrappers ready for all platforms!');
console.log('   - Linux/macOS: host.sh');
console.log('   - Windows: host.bat');
console.log('   Node will be detected at runtime on each platform');
console.log('');
