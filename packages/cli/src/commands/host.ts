import { chmodSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import { NATIVE_APP_NAME, NATIVE_MANIFEST_FILENAME } from '../constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createHostCommand(): Command {
  const host = new Command('host');
  host.description('Manage Native Messaging Host');

  // host install
  host
    .command('install')
    .description('Install Native Messaging Host for Chrome extension')
    .action(async () => {
      try {
        console.log(chalk.blue('🔧 Installing Chrome CLI Native Messaging Host...'));
        console.log('');

        // Get the absolute path to dist/native-host/host.sh
        const hostPath = getHostPath();

        if (!existsSync(hostPath)) {
          console.error(chalk.red(`❌ Error: ${hostPath} not found`));
          console.log(chalk.yellow('Please run "npm run build" first'));
          process.exit(1);
        }

        // Make host executable
        try {
          chmodSync(hostPath, 0o755);
        } catch (error) {
          console.error(chalk.red('❌ Failed to make host executable'));
          throw error;
        }

        // Show Chrome extension path
        const extensionPath = getExtensionPath();
        if (extensionPath && existsSync(extensionPath)) {
          console.log(chalk.bold('📦 Chrome Extension Location:'));
          console.log(chalk.cyan(`   ${extensionPath}`));
          console.log('');
          console.log(chalk.dim('   Load this directory in chrome://extensions/ (Developer mode → Load unpacked)'));
          console.log('');
        }

        // Get Chrome extension ID from user
        console.log('📋 Please provide your Chrome Extension ID');
        console.log(chalk.dim('   (Find it at chrome://extensions/ after loading the extension)'));
        console.log('');

        const extensionId = await promptExtensionId();

        if (!extensionId || extensionId.trim().length === 0) {
          console.error(chalk.red('❌ Extension ID is required'));
          process.exit(1);
        }

        // Detect OS and get manifest directory
        const manifestDir = getManifestDirectory();

        if (!manifestDir) {
          console.error(chalk.red('❌ Unsupported operating system'));
          console.log(chalk.yellow('Supported: Linux, macOS, Windows'));
          process.exit(1);
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

        console.log('');
        console.log(chalk.green('✅ Native Messaging Host installed successfully!'));
        console.log('');
        console.log(`📄 Manifest location: ${chalk.cyan(manifestPath)}`);
        console.log(`🔧 Host location: ${chalk.cyan(hostPath)}`);
        console.log(`🆔 Extension ID: ${chalk.cyan(extensionId.trim())}`);
        console.log('');
        console.log(chalk.bold('Next steps:'));
        console.log('1. Reload the Chrome extension at chrome://extensions/');
        console.log('2. Test with: chrome-cmd tabs list');
        console.log('');
      } catch (error) {
        console.error(chalk.red('Error installing host:'), error);
        process.exit(1);
      }
    });

  // host uninstall
  host
    .command('uninstall')
    .description('Uninstall Native Messaging Host')
    .action(async () => {
      try {
        console.log(chalk.blue('🗑️  Uninstalling Chrome CLI Native Messaging Host...'));
        console.log('');

        const manifestPath = getManifestPath();

        if (!existsSync(manifestPath)) {
          console.log(chalk.yellow('⚠️  Native Messaging Host is not installed'));
          console.log(chalk.dim(`   (${manifestPath} not found)`));
          process.exit(0);
        }

        // Remove manifest
        unlinkSync(manifestPath);

        console.log(chalk.green('✅ Native Messaging Host uninstalled successfully!'));
        console.log('');
        console.log(`📄 Removed: ${chalk.cyan(manifestPath)}`);
        console.log('');
        console.log(chalk.dim('To reinstall, run: chrome-cmd host install'));
        console.log('');
      } catch (error) {
        console.error(chalk.red('Error uninstalling host:'), error);
        process.exit(1);
      }
    });

  return host;
}

/**
 * Get the path to the native messaging host script
 * Returns platform-specific wrapper: host.sh (Linux/macOS) or host.bat (Windows)
 */
function getHostPath(): string {
  const os = platform();
  const isWindows = os === 'win32';
  const hostFile = isWindows ? 'host.bat' : 'host.sh';

  // Try to find host script in dist/native-host/
  // This works both in dev (packages/cli/dist) and installed (node_modules/chrome-cmd/dist)
  const distPath = join(__dirname, '../../dist/native-host', hostFile);

  if (existsSync(distPath)) {
    return distPath;
  }

  // Fallback: try relative to current file
  const relativePath = join(__dirname, '../native-host', hostFile);
  if (existsSync(relativePath)) {
    return relativePath;
  }

  // Last resort: check if we're in installed package
  const installedPath = join(__dirname, '../../dist/native-host', hostFile);
  return installedPath;
}

/**
 * Get the path to the bundled Chrome extension
 */
function getExtensionPath(): string | null {
  // When installed via npm global: /usr/local/lib/node_modules/chrome-cmd/chrome-extension
  // When installed locally: ./node_modules/chrome-cmd/chrome-extension
  // When in development: packages/cli/chrome-extension
  //
  // This file (host.js) is located at: dist/commands/host.js
  // So from here:
  //   - ../../chrome-extension = chrome-cmd root + /chrome-extension ✅

  const installedPath = join(__dirname, '../../chrome-extension');
  if (existsSync(installedPath)) {
    return installedPath;
  }

  // Fallback: shouldn't be needed, but just in case
  const devPath = join(__dirname, '../../../chrome-extension');
  if (existsSync(devPath)) {
    return devPath;
  }

  return null;
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

/**
 * Prompt user for Chrome extension ID
 */
async function promptExtensionId(): Promise<string> {
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
