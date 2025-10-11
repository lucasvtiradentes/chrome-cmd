#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function printBanner() {
  console.log('');
  console.log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                                                                    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║${colors.reset}  ${colors.bright}${colors.green}✓ chrome-cmd installed successfully!${colors.reset}                          ${colors.bright}${colors.cyan}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                                                                    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
}

function printInstructions() {
  // When running from npm, the script is in node_modules/chrome-cmd/scripts/
  // The extension is in node_modules/chrome-cmd/chrome-extension/
  const extensionPath = path.resolve(__dirname, '..', 'chrome-extension');

  console.log(`${colors.bright}${colors.yellow}⚠  IMPORTANT - Setup Required:${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}Before using chrome-cmd, you need to install the Chrome extension:${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}${colors.cyan}Step 1:${colors.reset} Open Chrome and navigate to:`);
  console.log(`         ${colors.bright}chrome://extensions/${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}${colors.cyan}Step 2:${colors.reset} Enable ${colors.bright}"Developer mode"${colors.reset} (top right corner)`);
  console.log('');
  console.log(`${colors.bright}${colors.cyan}Step 3:${colors.reset} Click ${colors.bright}"Load unpacked"${colors.reset} and select this folder:`);
  console.log('');
  console.log(`         ${colors.bright}${colors.green}${extensionPath}${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}${colors.cyan}Step 4:${colors.reset} Copy the extension ID and run:`);
  console.log(`         ${colors.bright}chrome-cmd host install${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}${colors.cyan}Step 5:${colors.reset} Reload the extension in Chrome`);
  console.log('');
  console.log(`${colors.bright}${colors.cyan}Step 6:${colors.reset} Test it:`);
  console.log(`         ${colors.bright}chrome-cmd tabs list${colors.reset}`);
  console.log('');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log(`${colors.bright}Need help?${colors.reset} Run: ${colors.bright}chrome-cmd setup${colors.reset} or ${colors.bright}chrome-cmd --help${colors.reset}`);
  console.log('');
  console.log(`${colors.dim}Note: If you don't see this message, npm may be running scripts in`);
  console.log(`background mode. Run 'chrome-cmd setup' to see these instructions again.${colors.reset}`);
  console.log('');
}

function isDevEnvironment(): boolean {
  // Check if we're in a development environment (monorepo/git repo)
  // Script location: either scripts/ or dist/scripts/
  const packageRoot = path.resolve(__dirname, '..', '..');

  // Check if .git exists in parent directories (indicates we're in the repo)
  const gitDir = path.resolve(packageRoot, '.git');
  if (existsSync(gitDir)) {
    return true;
  }

  // Also check two levels up (for monorepo structure)
  const gitDirUp = path.resolve(packageRoot, '..', '..', '.git');
  if (existsSync(gitDirUp)) {
    return true;
  }

  // Check if we have workspace dependencies (indicates monorepo development)
  const sharedWorkspace = path.resolve(packageRoot, '..', 'shared');
  if (existsSync(sharedWorkspace)) {
    return true;
  }

  // Check if src directory exists (indicates we're in the source repo)
  const srcDir = path.resolve(packageRoot, 'packages', 'cli', 'src');
  if (existsSync(srcDir)) {
    return true;
  }

  return false;
}

function main() {
  // Only show postinstall message when installed from npm (not in development)
  if (isDevEnvironment()) {
    // Silent exit - we're in development mode
    process.exit(0);
  }

  printBanner();
  printInstructions();
}

main();
