import { chmodSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { NATIVE_APP_NAME, NATIVE_HOST_FOLDER, NATIVE_MANIFEST_FILENAME } from '../../shared/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function installNativeHost(extensionId: string, silent = false): Promise<void> {
  if (!silent) {
    console.log(chalk.blue('🔧 Installing Native Messaging Host...'));
    console.log('');
  }

  const hostPath = getHostPath();

  if (!existsSync(hostPath)) {
    throw new Error(`Host file not found: ${hostPath}`);
  }

  try {
    chmodSync(hostPath, 0o755);
  } catch {
    throw new Error('Failed to make host executable');
  }

  const manifestDir = getManifestDirectory();

  if (!manifestDir) {
    throw new Error('Unsupported operating system. Supported: Linux, macOS, Windows');
  }

  mkdirSync(manifestDir, { recursive: true });

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

  unlinkSync(manifestPath);

  if (!silent) {
    console.log(chalk.green('✅ Native Messaging Host uninstalled!'));
    console.log('');
  }
}

export function getExtensionPath(): string | null {
  // In dev mode (npm run dev), prefer dist/src/chrome-extension
  const devPath = join(__dirname, '../../../dist/src/chrome-extension');
  if (existsSync(devPath)) {
    return devPath;
  }

  // In production (installed via npm), use built chrome-extension
  const installedPath = join(__dirname, '../../chrome-extension');
  if (existsSync(installedPath)) {
    return installedPath;
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
  const os = platform();
  const isWindows = os === 'win32';
  const hostFile = isWindows ? 'host.bat' : 'host.sh';

  const installedPath = join(__dirname, '../../../', NATIVE_HOST_FOLDER, hostFile);
  if (existsSync(installedPath)) {
    return installedPath;
  }

  const devPath = join(__dirname, '../../../dist/', NATIVE_HOST_FOLDER, hostFile);
  if (existsSync(devPath)) {
    return devPath;
  }

  return installedPath;
}

function getManifestDirectory(): string | null {
  const os = platform();
  const home = homedir();

  switch (os) {
    case 'linux':
      return join(home, '.config', 'google-chrome', 'NativeMessagingHosts');
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
    case 'win32':
      return join(home, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'NativeMessagingHosts');
    default:
      return null;
  }
}

function getManifestPath(): string {
  const manifestDir = getManifestDirectory();
  if (!manifestDir) {
    throw new Error('Unsupported operating system');
  }
  return join(manifestDir, NATIVE_MANIFEST_FILENAME);
}
