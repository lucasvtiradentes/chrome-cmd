import { chmodSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { NATIVE_APP_NAME, NATIVE_MANIFEST_FILENAME } from '../constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Install native messaging host with a given extension ID
 */
export async function installNativeHost(extensionId: string, silent = false): Promise<void> {
  if (!silent) {
    console.log(chalk.blue('🔧 Installing Native Messaging Host...'));
    console.log('');
  }

  // Get the absolute path to dist/native-host/host.sh
  const hostPath = getHostPath();

  if (!existsSync(hostPath)) {
    throw new Error(`Host file not found: ${hostPath}`);
  }

  // Make host executable
  try {
    chmodSync(hostPath, 0o755);
  } catch {
    throw new Error('Failed to make host executable');
  }

  // Detect OS and get manifest directory
  const manifestDir = getManifestDirectory();

  if (!manifestDir) {
    throw new Error('Unsupported operating system. Supported: Linux, macOS, Windows');
  }

  // Create directory if it doesn't exist
  mkdirSync(manifestDir, { recursive: true });

  // Create manifest
  const manifestPath = getManifestPath();
  const manifest = {
    name: NATIVE_APP_NAME,
    description: 'Chrome CLI Native Messaging Host',
    path: hostPath,
    type: 'stdio',
    allowed_origins: [`chrome-extension://${extensionId.trim()}/`]
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  if (!silent) {
    console.log(chalk.green('✅ Native Messaging Host installed!'));
    console.log('');
    console.log(`📄 Manifest: ${chalk.dim(manifestPath)}`);
    console.log(`🆔 Extension ID: ${chalk.dim(extensionId.trim())}`);
    console.log('');
  }
}

/**
 * Uninstall native messaging host
 */
export async function uninstallNativeHost(silent = false): Promise<void> {
  if (!silent) {
    console.log(chalk.blue('🗑️  Uninstalling Native Messaging Host...'));
    console.log('');
  }

  const manifestPath = getManifestPath();

  if (!existsSync(manifestPath)) {
    if (!silent) {
      console.log(chalk.yellow('⚠️  Native Messaging Host is not installed'));
      console.log('');
    }
    return;
  }

  // Remove manifest
  unlinkSync(manifestPath);

  if (!silent) {
    console.log(chalk.green('✅ Native Messaging Host uninstalled!'));
    console.log('');
  }
}

/**
 * Get the path to the bundled Chrome extension
 * Always returns dist/chrome-extension path (works in both dev and built modes)
 */
export function getExtensionPath(): string | null {
  // When installed via npm (global or local):
  // __dirname = node_modules/chrome-cmd/dist/cli/lib
  // We need: node_modules/chrome-cmd/dist/chrome-extension
  const installedPath = join(__dirname, '../../chrome-extension');
  if (existsSync(installedPath)) {
    return installedPath;
  }

  // When running in dev mode:
  // __dirname = src/cli/lib (tsx) or dist/cli/lib (after build)
  // We need: dist/chrome-extension
  const devPath = join(__dirname, '../../../dist/chrome-extension');
  if (existsSync(devPath)) {
    return devPath;
  }

  return null;
}

/**
 * Prompt user for Chrome extension ID
 */
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

/**
 * Get the path to the native messaging host script
 * Returns platform-specific wrapper: host.sh (Linux/macOS) or host.bat (Windows)
 */
function getHostPath(): string {
  const os = platform();
  const isWindows = os === 'win32';
  const hostFile = isWindows ? 'host.bat' : 'host.sh';

  // When installed via npm (global or local):
  // __dirname = node_modules/chrome-cmd/dist/cli/lib
  // We need: node_modules/chrome-cmd/dist/native-host
  const installedPath = join(__dirname, '../../native-host', hostFile);
  if (existsSync(installedPath)) {
    return installedPath;
  }

  // When running in dev mode:
  // __dirname = src/cli/lib (before build) or dist/cli/lib (after build)
  // We need: dist/native-host
  const devPath = join(__dirname, '../../../dist/native-host', hostFile);
  if (existsSync(devPath)) {
    return devPath;
  }

  // Fallback: return the most likely path
  return installedPath;
}

/**
 * Get the Native Messaging manifest directory based on OS
 */
function getManifestDirectory(): string | null {
  const os = platform();
  const home = homedir();

  switch (os) {
    case 'linux':
      return join(home, '.config', 'google-chrome', 'NativeMessagingHosts');
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
    case 'win32':
      // Windows: Registry-based, but we can still create manifest for manual setup
      return join(home, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'NativeMessagingHosts');
    default:
      return null;
  }
}

/**
 * Get the manifest file path
 */
function getManifestPath(): string {
  const manifestDir = getManifestDirectory();
  if (!manifestDir) {
    throw new Error('Unsupported operating system');
  }
  return join(manifestDir, NATIVE_MANIFEST_FILENAME);
}
