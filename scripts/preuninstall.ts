#!/usr/bin/env node

/**
 * This script runs before npm uninstall to clean up shell completions
 */

import { uninstallCompletionSilently } from '../src/cli/commands/completion.js';

async function main() {
  try {
    await uninstallCompletionSilently();
  } catch (error) {
    // Fail silently to not block uninstall process
    console.error('Warning: Could not remove shell completions:', error);
  }
}

main();
