#!/usr/bin/env tsx

/**
 * Post-install script for chrome-cmd
 * Shows the path to the bundled Chrome extension
 * Cross-platform: Works on Linux, macOS, and Windows
 */

import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Detect if we're in development (monorepo) or production (npm install)
// Skip postinstall in development to avoid noise
const packageRoot = dirname(__dirname);
const isProduction = !existsSync(join(packageRoot, '..', '..', 'pnpm-workspace.yaml'));

// Only show message in production and if chrome-extension directory exists
const extensionPath = join(packageRoot, 'chrome-extension');

if (isProduction && existsSync(extensionPath)) {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                  🎉 Chrome CMD installed successfully!                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📦 Chrome Extension Location:');
  console.log(`   ${extensionPath}`);
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('');
  console.log('   1. Open Chrome and navigate to: chrome://extensions/');
  console.log('   2. Enable "Developer mode" (toggle in top-right)');
  console.log('   3. Click "Load unpacked" and select the path above');
  console.log('   4. Copy the Extension ID from the loaded extension');
  console.log('   5. Run: chrome-cmd host install');
  console.log('');
  console.log('📖 Full documentation: https://github.com/lucasvtiradentes/chrome-cmd');
  console.log('');
}
