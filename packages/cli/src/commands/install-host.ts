import { exec } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { Command } from 'commander';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

export function createInstallHostCommand(): Command {
  return new Command('install-host')
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

        // Get Chrome extension ID from user
        console.log('📋 Please provide your Chrome Extension ID');
        console.log(chalk.dim('   (Find it at chrome://extensions/)'));
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
          console.log(chalk.yellow('Supported: Linux, macOS'));
          process.exit(1);
        }

        // Create directory if it doesn't exist
        mkdirSync(manifestDir, { recursive: true });

        // Create manifest
        const manifestPath = join(manifestDir, 'com.chrome_cli.native.json');
        const manifest = {
          name: 'com.chrome_cli.native',
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
}

/**
 * Get the path to the native messaging host script
 */
function getHostPath(): string {
  // Try to find host.sh in dist/native-host/
  // This works both in dev (packages/cli/dist) and installed (node_modules/chrome-cmd/dist)
  const distPath = join(__dirname, '../../dist/native-host/host.sh');

  if (existsSync(distPath)) {
    return distPath;
  }

  // Fallback: try relative to current file
  const relativePath = join(__dirname, '../native-host/host.sh');
  if (existsSync(relativePath)) {
    return relativePath;
  }

  // Last resort: check if we're in installed package
  const installedPath = join(__dirname, '../../dist/native-host/host.sh');
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
    default:
      return null;
  }
}

/**
 * Prompt user for Chrome extension ID
 */
async function promptExtensionId(): Promise<string> {
  // Use readline for interactive prompt
  const readline = await import('node:readline');
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
