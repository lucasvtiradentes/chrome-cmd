import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as readline from 'node:readline';
import chalk from 'chalk';
import { FILES_CONFIG } from '../../shared/configs/files.config.js';
import { NATIVE_APP_NAME } from '../../shared/constants/constants.js';
import { IS_DEV } from '../../shared/constants/constants-node.js';
import { makeFileExecutable } from '../../shared/utils/functions/make-file-executable.js';
import { PathHelper } from '../../shared/utils/helpers/path.helper.js';
import { profileManager } from './profile-manager.js';

export async function installNativeHost(extensionId: string, silent = false): Promise<void> {
  if (!silent) {
    console.log(chalk.blue('🔧 Installing Native Messaging Host...'));
    console.log('');
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

  // Get all registered profiles and include their extensions in allowed_origins
  const allProfiles = profileManager.getAllProfiles();
  const allOrigins = allProfiles.map((profile) => `chrome-extension://${profile.extensionId}/`);

  // Ensure the current extension is always included
  const currentOrigin = `chrome-extension://${extensionId.trim()}/`;
  if (!allOrigins.includes(currentOrigin)) {
    allOrigins.push(currentOrigin);
  }

  const manifest = {
    name: NATIVE_APP_NAME,
    description: `Chrome CLI Native Messaging Host${IS_DEV ? ' (DEV)' : ''}`,
    path: hostPath,
    type: 'stdio',
    allowed_origins: allOrigins
  };

  writeFileSync(FILES_CONFIG.NATIVE_MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  if (!silent) {
    console.log(chalk.green('✅ Native Messaging Host installed!'));
    console.log('');
    console.log(`📄 Manifest: ${chalk.dim(FILES_CONFIG.NATIVE_MANIFEST_FILE)}`);
    console.log(`🆔 Active Extension: ${chalk.dim(extensionId.trim())}`);
    if (allOrigins.length > 1) {
      console.log(`📋 Total registered extensions: ${chalk.dim(allOrigins.length.toString())}`);
    }
    console.log('');
  }
}

export async function uninstallNativeHost(silent = false): Promise<void> {
  if (!silent) {
    console.log(chalk.blue('🗑️  Uninstalling Native Messaging Host...'));
    console.log('');
  }

  if (!existsSync(FILES_CONFIG.NATIVE_MANIFEST_FILE)) {
    if (!silent) {
      console.log(chalk.yellow('⚠️  Native Messaging Host is not installed'));
      console.log('');
    }
    return;
  }

  unlinkSync(FILES_CONFIG.NATIVE_MANIFEST_FILE);

  if (!silent) {
    console.log(chalk.green('✅ Native Messaging Host uninstalled!'));
    console.log('');
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
    rl.question(chalk.cyan('Extension ID: '), (answer) => {
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
