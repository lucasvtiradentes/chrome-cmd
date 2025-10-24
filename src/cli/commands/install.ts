import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as readline from 'node:readline';
import { Command } from 'commander';
import { getExtensionPath, getManifestDirectory, getManifestPath } from '../../bridge/installer.js';
import { CommandNames } from '../../protocol/commands/definitions.js';
import { createCommandFromSchema } from '../../protocol/commands/utils.js';
import { FILES_CONFIG } from '../../shared/configs/files.config.js';
import { createBridgeManifest } from '../../shared/utils/functions/create-bridge-manifest.js';
import { makeFileExecutable } from '../../shared/utils/functions/make-file-executable.js';
import { logger } from '../../shared/utils/helpers/logger.js';
import { PathHelper } from '../../shared/utils/helpers/path.helper.js';

function getBridgePath(): string {
  const bridgeFile = PathHelper.isWindows() ? 'bridge.bat' : 'bridge.sh';

  const installedPath = join(FILES_CONFIG.BRIDGE_DIR, bridgeFile);
  if (existsSync(installedPath)) {
    return installedPath;
  }

  const devPath = join(FILES_CONFIG.BRIDGE_DIST_DIR, bridgeFile);
  if (existsSync(devPath)) {
    return devPath;
  }

  return installedPath;
}

async function setupBridge(extensionId: string): Promise<void> {
  const bridgePath = getBridgePath();

  if (!existsSync(bridgePath)) {
    logger.newline();
    logger.warning('⚠  Bridge wrapper not found');
    logger.dim(`   Expected: ${bridgePath}`);
    logger.newline();
    return;
  }

  try {
    makeFileExecutable(bridgePath);
  } catch {
    logger.newline();
    logger.warning('⚠  Failed to make bridge executable');
    logger.newline();
  }

  const manifestDir = getManifestDirectory();

  if (!manifestDir) {
    logger.newline();
    logger.warning('⚠  Unsupported OS for bridge setup');
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

  const manifest = createBridgeManifest(bridgePath, existingOrigins);

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const isNewExtension = !existingOrigins.includes(newOrigin);

  logger.newline();
  if (isNewExtension) {
    logger.success('✓ Extension registered successfully');
  } else {
    logger.warning('⚠  Extension already registered');
  }
  logger.dim(`  Manifest: ${manifestPath}`);
  logger.dim(`  Host: ${bridgePath}`);
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

    await setupBridge(extensionId);

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
