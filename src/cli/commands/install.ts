import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as readline from 'node:readline';
import { Command } from 'commander';
import { CommandNames } from '../../shared/commands/definitions.js';
import { createCommandFromSchema } from '../../shared/commands/utils.js';
import { FILES_CONFIG } from '../../shared/configs/files.config.js';
import { createNativeManifest } from '../../shared/utils/functions/create-native-manifest.js';
import { makeFileExecutable } from '../../shared/utils/functions/make-file-executable.js';
import { logger } from '../../shared/utils/helpers/logger.js';
import { PathHelper } from '../../shared/utils/helpers/path.helper.js';
import { getExtensionPath, getManifestDirectory, getManifestPath } from '../lib/host-utils.js';

function getHostPath(): string {
  const hostFile = PathHelper.isWindows() ? 'host.bat' : 'host.sh';

  const installedPath = join(FILES_CONFIG.NATIVE_HOST_DIR, hostFile);
  if (existsSync(installedPath)) {
    return installedPath;
  }

  const devPath = join(FILES_CONFIG.NATIVE_HOST_DIST_DIR, hostFile);
  if (existsSync(devPath)) {
    return devPath;
  }

  return installedPath;
}

async function setupNativeHost(extensionId: string): Promise<void> {
  const hostPath = getHostPath();

  if (!existsSync(hostPath)) {
    logger.newline();
    logger.warning('⚠  Native host wrapper not found');
    logger.dim(`   Expected: ${hostPath}`);
    logger.newline();
    return;
  }

  try {
    makeFileExecutable(hostPath);
  } catch {
    logger.newline();
    logger.warning('⚠  Failed to make host executable');
    logger.newline();
  }

  const manifestDir = getManifestDirectory();

  if (!manifestDir) {
    logger.newline();
    logger.warning('⚠  Unsupported OS for native messaging');
    logger.newline();
    return;
  }

  const manifestPath = getManifestPath();
  PathHelper.ensureDir(manifestPath);

  let existingOrigins: string[] = [];
  if (existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      existingOrigins = existing.allowed_origins || [];
    } catch {
      // Ignore parse errors
    }
  }

  const newOrigin = `chrome-extension://${extensionId}/`;
  if (!existingOrigins.includes(newOrigin)) {
    existingOrigins.push(newOrigin);
  }

  const manifest = createNativeManifest(hostPath, existingOrigins);

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const isNewExtension = !existingOrigins.includes(newOrigin);

  logger.newline();
  if (isNewExtension) {
    logger.success('✓ Extension registered successfully');
  } else {
    logger.warning('⚠  Extension already registered');
  }
  logger.dim(`  Manifest: ${manifestPath}`);
  logger.dim(`  Host: ${hostPath}`);
  logger.dim(`  Extension ID: ${extensionId}`);
  if (existingOrigins.length > 1) {
    logger.dim(`  Total registered extensions: ${existingOrigins.length}`);
  }
  logger.newline();
}

export function createInstallCommand(): Command {
  return createCommandFromSchema(CommandNames.INSTALL).action(async () => {
    const extensionPath = getExtensionPath();

    if (!extensionPath) {
      logger.newline();
      logger.error('✗ Chrome extension not found');
      logger.newline();
      logger.info('The extension should be bundled with the CLI package.');
      logger.newline();
      process.exit(1);
    }

    logger.newline();
    logger.bold('Chrome CMD Installation');
    logger.newline();
    logger.bold('Extension Path:');
    logger.success(extensionPath);
    logger.newline();
    logger.info('─────────────────────────────────────────────────────────────────────');
    logger.newline();
    logger.bold('Installation Steps:');
    logger.newline();
    logger.info('Step 1: Load the Chrome extension');
    logger.info('  • Open Chrome: chrome://extensions/');
    logger.info('  • Enable "Developer mode" (top right)');
    logger.info('  • Click "Load unpacked" and select the folder above');
    logger.newline();
    logger.info('Step 2: Copy the Extension ID');
    logger.info('  • Find the extension ID shown below the extension name');
    logger.dim('  • It looks like: abcdefghijklmnopqrstuvwxyzabcdef');
    logger.newline();
    logger.info('─────────────────────────────────────────────────────────────────────');
    logger.newline();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const extensionId = await new Promise<string>((resolve) => {
      rl.question('Paste the Extension ID here: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (!extensionId || extensionId.length !== 32) {
      logger.newline();
      logger.error('✗ Invalid Extension ID');
      logger.newline();
      logger.info('Extension ID must be exactly 32 characters.');
      logger.newline();
      process.exit(1);
    }

    await setupNativeHost(extensionId);

    logger.success('✓ Installation complete!');
    logger.newline();
    logger.info('Chrome CMD is now ready to use!');
    logger.info('Try running: chrome-cmd tabs list');
    logger.newline();
    logger.dim('💡 Tip: You can register multiple extensions (different profiles)');
    logger.dim('   Just run this command again with a different Extension ID');
    logger.newline();
  });
}
