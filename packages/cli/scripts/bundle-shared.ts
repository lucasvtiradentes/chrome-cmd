#!/usr/bin/env tsx

/**
 * Bundle @chrome-cmd/shared into CLI package
 * Copies shared package and rewrites imports for standalone distribution
 * Cross-platform: Works on Linux, macOS, and Windows
 */

import { cpSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliRoot = dirname(__dirname);
const sharedDist = join(cliRoot, '..', '..', 'shared', 'dist');
const cliDist = join(cliRoot, 'dist');
const cliSharedDist = join(cliDist, 'shared');

console.log('📦 Bundling @chrome-cmd/shared into CLI package...');

// Check if shared dist exists
if (!existsSync(sharedDist)) {
  console.error('❌ Error: @chrome-cmd/shared not built yet');
  console.error(`   Expected: ${sharedDist}`);
  console.error("   Please run 'pnpm build-shared' first");
  process.exit(1);
}

// Check if CLI dist exists
if (!existsSync(cliDist)) {
  console.error('❌ Error: CLI not built yet');
  console.error(`   Expected: ${cliDist}`);
  console.error("   Please run 'tsc' first");
  process.exit(1);
}

// Copy shared dist to CLI dist
console.log('📋 Copying @chrome-cmd/shared to CLI dist...');
cpSync(sharedDist, cliSharedDist, { recursive: true });

// Rewrite imports in all JS files in dist
console.log('🔧 Rewriting imports from @chrome-cmd/shared to ./shared/index.js...');

function rewriteImports(dir: string, baseDir: string) {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);

    if (file.isDirectory()) {
      rewriteImports(fullPath, baseDir);
    } else if (file.name.endsWith('.js')) {
      let content = readFileSync(fullPath, 'utf-8');
      const relativePath = join(dir, file.name).replace(baseDir, '').split('/').filter(Boolean);
      const depth = relativePath.length - 1; // -1 because we don't count the file itself
      const relativePrefix = depth > 0 ? '../'.repeat(depth) : './';

      // Replace: from '@chrome-cmd/shared' -> from './shared/index.js' (or ../shared/index.js, etc)
      const replaced = content.replace(
        /from ['"]@chrome-cmd\/shared['"]/g,
        `from '${relativePrefix}shared/index.js'`
      );

      if (replaced !== content) {
        writeFileSync(fullPath, replaced, 'utf-8');
        console.log(`  ✅ ${fullPath.replace(baseDir + '/', '')}`);
      }
    }
  }
}

rewriteImports(cliDist, cliDist);

console.log('✅ @chrome-cmd/shared bundled successfully!');
console.log(`   Location: ${cliSharedDist}`);
console.log('');
