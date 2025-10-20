import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import { createCommandFromSchema } from '../../shared/commands/command-builder.js';
import { CommandNames } from '../../shared/commands/commands-definitions.js';
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

async function setupNativeHost(extensionId: string): Promise<void> {
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

  const manifest = {
    name: NATIVE_APP_NAME,
    description: `Chrome CLI Native Messaging Host${IS_DEV ? ' (DEV)' : ''}`,
    path: hostPath,
    type: 'stdio',
    allowed_origins: existingOrigins
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const isNewExtension = !existingOrigins.includes(newOrigin);

  console.log('');
  if (isNewExtension) {
    console.log(chalk.green('✓ Extension registered successfully'));
  } else {
    console.log(chalk.yellow('⚠  Extension already registered'));
  }
  console.log(chalk.dim(`  Manifest: ${manifestPath}`));
  console.log(chalk.dim(`  Host: ${hostPath}`));
  console.log(chalk.dim(`  Extension ID: ${extensionId}`));
  if (existingOrigins.length > 1) {
    console.log(chalk.dim(`  Total registered extensions: ${existingOrigins.length}`));
  }
  console.log('');
}

export function createInstallCommand(): Command {
  return createCommandFromSchema(CommandNames.INSTALL).action(async () => {
    const extensionPath = getExtensionPath();

    if (!extensionPath) {
      console.log('');
      console.log(chalk.red('✗ Chrome extension not found'));
      console.log('');
      console.log('The extension should be bundled with the CLI package.');
      console.log('');
      process.exit(1);
    }

    console.log('');
    console.log(chalk.bold('Chrome CMD Installation'));
    console.log('');
    console.log(chalk.bold('Extension Path:'));
    console.log(chalk.green(extensionPath));
    console.log('');
    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('');
    console.log(chalk.bold('Installation Steps:'));
    console.log('');
    console.log(`${chalk.bold('Step 1:')} Load the Chrome extension`);
    console.log(`  • Open Chrome: ${chalk.cyan('chrome://extensions/')}`);
    console.log(`  • Enable ${chalk.bold('"Developer mode"')} (top right)`);
    console.log(`  • Click ${chalk.bold('"Load unpacked"')} and select the folder above`);
    console.log('');
    console.log(`${chalk.bold('Step 2:')} Copy the Extension ID`);
    console.log(`  • Find the extension ID shown below the extension name`);
    console.log(`  • It looks like: ${chalk.dim('abcdefghijklmnopqrstuvwxyzabcdef')}`);
    console.log('');
    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const extensionId = await new Promise<string>((resolve) => {
      rl.question(chalk.cyan('Paste the Extension ID here: '), (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (!extensionId || extensionId.length !== 32) {
      console.log('');
      console.log(chalk.red('✗ Invalid Extension ID'));
      console.log('');
      console.log('Extension ID must be exactly 32 characters.');
      console.log('');
      process.exit(1);
    }

    await setupNativeHost(extensionId);

    console.log(chalk.green('✓ Installation complete!'));
    console.log('');
    console.log('Chrome CMD is now ready to use!');
    console.log(`Try running: ${chalk.cyan('chrome-cmd tabs list')}`);
    console.log('');
    console.log(chalk.dim('💡 Tip: You can register multiple extensions (different profiles)'));
    console.log(chalk.dim('   Just run this command again with a different Extension ID'));
    console.log('');
  });
}
