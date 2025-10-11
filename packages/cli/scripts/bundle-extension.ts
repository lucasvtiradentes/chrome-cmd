#!/usr/bin/env tsx

/**
 * Bundle chrome-extension into CLI package
 * Copies the built chrome extension into the CLI package for distribution
 * Cross-platform: Works on Linux, macOS, and Windows
 */

import { cpSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliRoot = dirname(__dirname);
const chromeExtDir = join(cliRoot, '..', 'chrome-extension');
const chromeExtDist = join(chromeExtDir, 'dist');
const cliExtensionDir = join(cliRoot, 'chrome-extension');

console.log('📦 Bundling chrome-extension into CLI package...');

// Check if chrome-extension dist exists
if (!existsSync(chromeExtDist)) {
  console.error('❌ Error: Chrome extension not built yet');
  console.error(`   Expected: ${chromeExtDist}`);
  console.error("   Please run 'pnpm build' in packages/chrome-extension first");
  process.exit(1);
}

// Remove existing chrome-extension directory in CLI
if (existsSync(cliExtensionDir)) {
  console.log('🗑️  Removing old chrome-extension directory...');
  rmSync(cliExtensionDir, { recursive: true, force: true });
}

// Copy chrome-extension dist to CLI package
console.log('📋 Copying chrome-extension build to CLI package...');
cpSync(chromeExtDist, cliExtensionDir, { recursive: true });

console.log('✅ Chrome extension bundled successfully!');
console.log(`   Location: ${cliExtensionDir}`);
console.log('   Files:');

// List files
const files = readdirSync(cliExtensionDir);
files.forEach(file => {
  const filePath = join(cliExtensionDir, file);
  const stats = statSync(filePath);
  const size = stats.isDirectory() ? 'DIR' : `${Math.ceil(stats.size / 1024)}KB`;
  console.log(`     - ${file.padEnd(30)} ${size}`);
});

console.log('');
