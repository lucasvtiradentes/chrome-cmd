#!/usr/bin/env tsx

/**
 * Prepare package.json for publishing
 * Removes workspace dependencies that are bundled into the package
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, '..', 'package.json');

console.log('📝 Preparing package.json for publishing...');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Remove workspace dependencies (they are bundled)
if (packageJson.dependencies && packageJson.dependencies['@chrome-cmd/shared']) {
  console.log('  🗑️  Removing @chrome-cmd/shared from dependencies (bundled)');
  delete packageJson.dependencies['@chrome-cmd/shared'];
}

// Write back
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

console.log('✅ package.json prepared for publishing');
console.log('');
