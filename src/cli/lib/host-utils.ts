import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as readline from 'node:readline';
import { FILES_CONFIG } from '../../shared/configs/files.config.js';
import { createNativeManifest } from '../../shared/utils/functions/create-native-manifest.js';
import { makeFileExecutable } from '../../shared/utils/functions/make-file-executable.js';
import { logger } from '../../shared/utils/helpers/logger.js';
import { PathHelper } from '../../shared/utils/helpers/path.helper.js';
import { profileManager } from './profile-manager.js';

export async function installNativeHost(extensionId: string, silent = false): Promise<void> {
  if (!silent) {
    logger.blue('🔧 Installing Native Messaging Host...');
    logger.newline();
  }

  const hostPath = getHostPath();

  if (!existsSync(hostPath)) {
    throw new Error(`Host file not found: ${hostPath}`);
  }

  makeFileExecutable(hostPath);

  if (!FILES_CONFIG.NATIVE_MANIFEST_DIR) {
    throw new Error('Unsupported operating system. Supported: Linux, macOS, Windows');
  }

  PathHelper.ensureDir(FILES_CONFIG.NATIVE_MANIFEST_FILE);

  const allProfiles = profileManager.getAllProfiles();
  const allOrigins = allProfiles.map((profile) => `chrome-extension://${profile.extensionId}/`);

  const currentOrigin = `chrome-extension://${extensionId.trim()}/`;
  if (!allOrigins.includes(currentOrigin)) {
    allOrigins.push(currentOrigin);
  }

  const manifest = createNativeManifest(hostPath, allOrigins);

  writeFileSync(FILES_CONFIG.NATIVE_MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  if (!silent) {
    logger.success('✅ Native Messaging Host installed!');
    logger.newline();
    logger.info(`📄 Manifest: ${FILES_CONFIG.NATIVE_MANIFEST_FILE}`);
    logger.info(`🆔 Active Extension: ${extensionId.trim()}`);
    if (allOrigins.length > 1) {
      logger.info(`📋 Total registered extensions: ${allOrigins.length.toString()}`);
    }
    logger.newline();
  }
}

export async function uninstallNativeHost(silent = false): Promise<void> {
  if (!silent) {
    logger.blue('🗑️  Uninstalling Native Messaging Host...');
    logger.newline();
  }

  if (!existsSync(FILES_CONFIG.NATIVE_MANIFEST_FILE)) {
    if (!silent) {
      logger.warning('⚠️  Native Messaging Host is not installed');
      logger.newline();
    }
    return;
  }

  unlinkSync(FILES_CONFIG.NATIVE_MANIFEST_FILE);

  if (!silent) {
    logger.success('✅ Native Messaging Host uninstalled!');
    logger.newline();
  }
}

export function getExtensionPath(): string | null {
  if (existsSync(FILES_CONFIG.CHROME_EXTENSION_DEV_DIR)) {
    return FILES_CONFIG.CHROME_EXTENSION_DEV_DIR;
  }

  if (existsSync(FILES_CONFIG.CHROME_EXTENSION_PROD_DIR)) {
    return FILES_CONFIG.CHROME_EXTENSION_PROD_DIR;
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

export function getManifestDirectory(): string | null {
  return FILES_CONFIG.NATIVE_MANIFEST_DIR || null;
}

export function getManifestPath(): string {
  if (!FILES_CONFIG.NATIVE_MANIFEST_FILE) {
    throw new Error('Unsupported operating system');
  }
  return FILES_CONFIG.NATIVE_MANIFEST_FILE;
}
