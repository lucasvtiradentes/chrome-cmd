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

  console.log(`${colors.bright}${colors.yellow}⚠  Setup Required:${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}Run the interactive installation to get started:${colors.reset}`);
  console.log('');
  console.log(`         ${colors.bright}${colors.cyan}chrome-cmd extension install${colors.reset}`);
  console.log('');
  console.log('This will guide you through:');
  console.log(`  ${colors.cyan}•${colors.reset} Loading the extension in Chrome`);
  console.log(`  ${colors.cyan}•${colors.reset} Entering the extension ID`);
  console.log(`  ${colors.cyan}•${colors.reset} Configuring native messaging`);
  console.log('');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log(`${colors.bright}Quick reference:${colors.reset}`);
  console.log('');
  console.log(`  ${colors.cyan}chrome-cmd extension install${colors.reset}    ${colors.dim}# Interactive setup (recommended)${colors.reset}`);
  console.log(`  ${colors.cyan}chrome-cmd extension setup${colors.reset}      ${colors.dim}# View manual instructions${colors.reset}`);
  console.log(`  ${colors.cyan}chrome-cmd --help${colors.reset}               ${colors.dim}# Show all commands${colors.reset}`);
  console.log('');
  console.log(`${colors.dim}Note: If you don't see this message, npm may be running scripts in`);
  console.log(`background mode. Run 'chrome-cmd extension install' to start setup.${colors.reset}`);
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
