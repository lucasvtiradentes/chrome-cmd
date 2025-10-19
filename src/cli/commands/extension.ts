import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import { createCommandFromSchema } from '../../shared/commands/command-builder.js';
import { CommandNames } from '../../shared/commands/commands-schema.js';
import { NATIVE_APP_NAME, NATIVE_HOST_FOLDER, NATIVE_MANIFEST_FILENAME } from '../../shared/constants/constants.js';
import { IS_DEV } from '../../shared/constants/constants-node.js';
import { getExtensionPath } from '../lib/host-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

function setupNativeHost(): void {
  const hostPath = getHostPath();

  if (!existsSync(hostPath)) {
    console.log('');
    console.log(chalk.yellow('⚠  Native host wrapper not found'));
    console.log(chalk.dim(`   Expected: ${hostPath}`));
    console.log('');
    return;
  }

  try {
    chmodSync(hostPath, 0o755);
  } catch {
    console.log('');
    console.log(chalk.yellow('⚠  Failed to make host executable'));
    console.log('');
  }

  const manifestDir = getManifestDirectory();

  if (!manifestDir) {
    console.log('');
    console.log(chalk.yellow('⚠  Unsupported OS for native messaging'));
    console.log('');
    return;
  }

  mkdirSync(manifestDir, { recursive: true });

  const manifestPath = join(manifestDir, NATIVE_MANIFEST_FILENAME);
  const manifest = {
    name: NATIVE_APP_NAME,
    description: `Chrome CLI Native Messaging Host${IS_DEV ? ' (DEV)' : ''}`,
    path: hostPath,
    type: 'stdio',
    allowed_origins: []
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('');
  console.log(chalk.green('✓ Native messaging host configured'));
  console.log(chalk.dim(`  Manifest: ${manifestPath}`));
  console.log(chalk.dim(`  Host: ${hostPath}`));
  console.log('');
  console.log(chalk.yellow('⚠  Note: Extension will auto-register when loaded for the first time'));
  console.log('');
}

export function createExtensionCommand(): Command {
  return createCommandFromSchema(CommandNames.EXTENSION).action(async () => {
    const extensionPath = getExtensionPath();

    if (!extensionPath) {
      console.log('');
      console.log(chalk.red('✗ Chrome extension not found'));
      console.log('');
      console.log('The extension should be bundled with the CLI package.');
      console.log('');
      process.exit(1);
    }

    setupNativeHost();

    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('');
    console.log(chalk.bold('Extension Installation Path'));
    console.log('');
    console.log(chalk.green(extensionPath));
    console.log('');
    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('');
    console.log(chalk.bold('Installation Instructions:'));
    console.log('');
    console.log(`1. Open Chrome and navigate to: ${chalk.cyan('chrome://extensions/')}`);
    console.log(`2. Enable ${chalk.bold('"Developer mode"')} (top right corner)`);
    console.log(`3. Click ${chalk.bold('"Load unpacked"')} and select the folder above`);
    console.log('');
  });
}
