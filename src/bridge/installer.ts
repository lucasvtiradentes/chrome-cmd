import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as readline from 'node:readline';
import { profileManager } from '../cli/core/managers/profile.js';
import { FILES_CONFIG } from '../shared/configs/files.config.js';
import { makeFileExecutable } from '../shared/utils/functions/make-file-executable.js';
import { logger } from '../shared/utils/helpers/logger.js';
import { PathHelper } from '../shared/utils/helpers/path.helper.js';
import { createBridgeManifest } from './create-bridge-manifest.js';

export async function installBridge(extensionId: string, silent = false): Promise<void> {
  if (!silent) {
    logger.blue('🔧 Installing Bridge...');
    logger.newline();
  }

  const bridgePath = getBridgePath();

  if (!existsSync(bridgePath)) {
    throw new Error(`Host file not found: ${bridgePath}`);
  }

  makeFileExecutable(bridgePath);

  if (!FILES_CONFIG.BRIDGE_MANIFEST_DIR) {
    throw new Error('Unsupported operating system. Supported: Linux, macOS, Windows');
  }

  PathHelper.ensureDir(FILES_CONFIG.BRIDGE_MANIFEST_FILE);

  const allProfiles = profileManager.getAllProfiles();
  const allOrigins = allProfiles.map((profile) => `chrome-extension://${profile.extensionId}/`);

  const currentOrigin = `chrome-extension://${extensionId.trim()}/`;
  if (!allOrigins.includes(currentOrigin)) {
    allOrigins.push(currentOrigin);
  }

  const manifest = createBridgeManifest(bridgePath, allOrigins);

  writeFileSync(FILES_CONFIG.BRIDGE_MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  if (!silent) {
    logger.success('✅ Bridge installed!');
    logger.newline();
    logger.info(`📄 Manifest: ${FILES_CONFIG.BRIDGE_MANIFEST_FILE}`);
    logger.info(`🆔 Active Extension: ${extensionId.trim()}`);
    if (allOrigins.length > 1) {
      logger.info(`📋 Total registered extensions: ${allOrigins.length.toString()}`);
    }
    logger.newline();
  }
}

export async function uninstallBridge(silent = false): Promise<void> {
  if (!silent) {
    logger.blue('🗑️  Uninstalling Bridge...');
    logger.newline();
  }

  if (!existsSync(FILES_CONFIG.BRIDGE_MANIFEST_FILE)) {
    if (!silent) {
      logger.warning('⚠️  Bridge is not installed');
      logger.newline();
    }
    return;
  }

  unlinkSync(FILES_CONFIG.BRIDGE_MANIFEST_FILE);

  if (!silent) {
    logger.success('✅ Bridge uninstalled!');
    logger.newline();
  }
}

export function getExtensionPath(): string | null {
  if (existsSync(FILES_CONFIG.EXTENSION_DEV_DIR)) {
    return FILES_CONFIG.EXTENSION_DEV_DIR;
  }

  if (existsSync(FILES_CONFIG.EXTENSION_PROD_DIR)) {
    return FILES_CONFIG.EXTENSION_PROD_DIR;
  }

  return null;
}

export async function promptExtensionId(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Extension ID: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

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

export function getManifestDirectory(): string | null {
  return FILES_CONFIG.BRIDGE_MANIFEST_DIR || null;
}

export function getManifestPath(): string {
  if (!FILES_CONFIG.BRIDGE_MANIFEST_FILE) {
    throw new Error('Unsupported operating system');
  }
  return FILES_CONFIG.BRIDGE_MANIFEST_FILE;
}
