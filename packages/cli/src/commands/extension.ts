import { exec } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { Command } from 'commander';
import { configManager } from '../lib/config-manager.js';
import { getExtensionPath, installNativeHost, promptExtensionId, uninstallNativeHost } from '../lib/host-utils.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function displaySetup(): void {
  // Find extension path - it's bundled with the CLI
  const extensionPath = path.resolve(__dirname, '..', '..', 'chrome-extension');

  console.log('');
  console.log(chalk.bold.cyan('╔════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                                                                    ║'));
  console.log(
    chalk.bold.cyan('║') +
      '  ' +
      chalk.bold.green('Chrome Extension - Setup Instructions') +
      '                       ' +
      chalk.bold.cyan('║')
  );
  console.log(chalk.bold.cyan('║                                                                    ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════════════╝'));
  console.log('');

  console.log(chalk.bold.yellow('⚠  Setup Required'));
  console.log('');
  console.log('Follow these steps to install and configure the Chrome extension:');
  console.log('');

  console.log(`${chalk.bold.cyan('Step 1:')} Open Chrome and navigate to:`);
  console.log(`         ${chalk.bold('chrome://extensions/')}`);
  console.log('');

  console.log(`${chalk.bold.cyan('Step 2:')} Enable ${chalk.bold('"Developer mode"')} (top right corner)`);
  console.log('');

  console.log(`${chalk.bold.cyan('Step 3:')} Click ${chalk.bold('"Load unpacked"')} and select this folder:`);
  console.log('');
  console.log(`         ${chalk.bold.green(extensionPath)}`);
  console.log('');

  console.log(
    `${chalk.bold.cyan('Step 4:')} Copy the ${chalk.bold('Extension ID')} (looks like: abcdefghijklmnopqrstuvwxyz123456)`
  );
  console.log('');

  console.log(`${chalk.bold.cyan('Step 5:')} Run the host install command:`);
  console.log(`         ${chalk.bold('chrome-cmd host install')}`);
  console.log('         (Paste the Extension ID when prompted)');
  console.log('');

  console.log(`${chalk.bold.cyan('Step 6:')} Reload the extension:`);
  console.log(`         ${chalk.bold('chrome-cmd extension reload')}`);
  console.log('');

  console.log(`${chalk.bold.cyan('Step 7:')} Test the connection:`);
  console.log(`         ${chalk.bold('chrome-cmd tabs list')}`);
  console.log('');

  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log(chalk.bold('Troubleshooting:'));
  console.log('');
  console.log('• Extension not working? Check the Service Worker console for errors');
  console.log('• Connection failed? Make sure the extension is reloaded after host install');
  console.log(`• Still stuck? Run ${chalk.cyan('chrome-cmd mediator status')} to check the server`);
  console.log('');
  console.log(chalk.dim('For more help, visit: https://github.com/lucasvtiradentes/chrome-cmd'));
  console.log('');
}

async function reloadExtension(): Promise<void> {
  try {
    console.log('');
    console.log(chalk.blue('🔄 Reloading Chrome extension...'));
    console.log('');

    // Import ExtensionClient dynamically
    const { ExtensionClient } = await import('../lib/extension-client.js');
    const { ChromeCommand } = await import('@chrome-cmd/shared');

    const client = new ExtensionClient();

    // Step 1: Check if extension is connected (ping)
    try {
      await client.sendCommand(ChromeCommand.PING);
      console.log(chalk.dim('✓ Extension is connected'));
      console.log('');
    } catch (error) {
      throw new Error('Extension is not connected. Make sure it is loaded and connected to the mediator.');
    }

    // Step 2: Send reload command (this will disconnect, which is expected)
    console.log(chalk.dim('Sending reload command...'));
    console.log('');

    try {
      await client.sendCommand(ChromeCommand.RELOAD_EXTENSION);
      // If we get here, the extension responded before reloading (shouldn't happen)
      console.log(chalk.green('✓ Extension reloaded successfully!'));
      console.log('');
    } catch (error) {
      // If fetch fails, it means the extension reloaded (connection was closed)
      if (
        error instanceof Error &&
        (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED'))
      ) {
        console.log(chalk.green('✓ Extension reloaded successfully!'));
        console.log('');
        console.log(chalk.dim('The extension has been reloaded.'));
        console.log(chalk.dim('Wait a few seconds for it to reconnect to the mediator.'));
        console.log('');
        return;
      }
      throw error;
    }
  } catch (error) {
    console.log('');
    console.log(chalk.red('✗ Failed to reload extension'));
    console.log('');

    if (error instanceof Error) {
      console.log(chalk.yellow('Error:'), error.message);
      console.log('');
    }

    console.log(chalk.bold('Manual reload:'));
    console.log(`1. Open ${chalk.cyan('chrome://extensions/')}`);
    console.log(`2. Find "Chrome CLI Bridge" extension`);
    console.log(`3. Click the ${chalk.cyan('reload icon')} (↻)`);
    console.log('');
    process.exit(1);
  }
}

function setExtensionId(extensionId: string): void {
  // Validate extension ID format (Chrome extension IDs are 32 characters, lowercase letters only)
  if (!/^[a-z]{32}$/.test(extensionId)) {
    console.log('');
    console.log(chalk.red('✗ Invalid extension ID format'));
    console.log('');
    console.log('Extension IDs should be 32 lowercase letters (a-z)');
    console.log(`Example: ${chalk.dim('abcdefghijklmnopqrstuvwxyzabcdef')}`);
    console.log('');
    console.log('You can find your extension ID in chrome://extensions/');
    console.log('');
    process.exit(1);
  }

  configManager.setExtensionId(extensionId);

  console.log('');
  console.log(chalk.green('✓ Extension ID saved!'));
  console.log('');
  console.log(`Extension ID: ${chalk.dim(extensionId)}`);
  console.log(`Config file: ${chalk.dim(configManager.getConfigPath())}`);
  console.log('');
  console.log('You can now use:');
  console.log(`  ${chalk.cyan('chrome-cmd extension reload')} - Reload the extension`);
  console.log(`  ${chalk.cyan('chrome-cmd extension info')}   - Show extension info`);
  console.log('');
}

function showExtensionInfo(): void {
  const extensionId = configManager.getExtensionId();

  console.log('');
  console.log(chalk.bold('Chrome Extension Configuration'));
  console.log('');

  if (extensionId) {
    console.log(`Extension ID: ${chalk.green(extensionId)}`);
    console.log(`Config file:  ${chalk.dim(configManager.getConfigPath())}`);
    console.log('');
    console.log(chalk.dim('To change the extension ID:'));
    console.log(`  ${chalk.cyan('chrome-cmd extension id <new-id>')}`);
  } else {
    console.log(chalk.yellow('Extension ID not configured'));
    console.log('');
    console.log('To set your extension ID:');
    console.log(`  ${chalk.cyan('chrome-cmd extension id <extension-id>')}`);
    console.log('');
    console.log('You can find your extension ID in chrome://extensions/');
  }

  console.log('');
}

function removeExtensionId(): void {
  const extensionId = configManager.getExtensionId();

  if (!extensionId) {
    console.log('');
    console.log(chalk.yellow('No extension ID configured'));
    console.log('');
    return;
  }

  configManager.clearExtensionId();

  console.log('');
  console.log(chalk.green('✓ Extension ID removed'));
  console.log('');
}

async function installExtension(): Promise<void> {
  console.log('');
  console.log(chalk.bold.cyan('╔════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                                                                    ║'));
  console.log(
    chalk.bold.cyan('║') +
      '  ' +
      chalk.bold.green('Chrome Extension - Installation') +
      '                              ' +
      chalk.bold.cyan('║')
  );
  console.log(chalk.bold.cyan('║                                                                    ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════════════╝'));
  console.log('');

  // Find extension path
  const extensionPath = getExtensionPath();

  if (!extensionPath) {
    console.log(chalk.red('✗ Chrome extension not found'));
    console.log('');
    console.log('The extension should be bundled with the CLI package.');
    console.log('');
    process.exit(1);
  }

  console.log(chalk.bold('Step 1: Load Extension in Chrome'));
  console.log('');
  console.log(`1. Open Chrome and navigate to: ${chalk.cyan('chrome://extensions/')}`);
  console.log(`2. Enable ${chalk.bold('"Developer mode"')} (top right corner)`);
  console.log(`3. Click ${chalk.bold('"Load unpacked"')} and select this folder:`);
  console.log('');
  console.log(`   ${chalk.green(extensionPath)}`);
  console.log('');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');

  // Get Chrome extension ID from user
  console.log(chalk.bold('Step 2: Enter Extension ID'));
  console.log('');
  console.log('After loading the extension, copy its ID from chrome://extensions/');
  console.log(chalk.dim('(Extension IDs are 32 lowercase letters)'));
  console.log('');

  const extensionId = await promptExtensionId();

  if (!extensionId || extensionId.trim().length === 0) {
    console.log('');
    console.log(chalk.red('✗ Extension ID is required'));
    console.log('');
    process.exit(1);
  }

  // Validate extension ID format
  if (!/^[a-z]{32}$/.test(extensionId.trim())) {
    console.log('');
    console.log(chalk.red('✗ Invalid extension ID format'));
    console.log('');
    console.log('Extension IDs should be 32 lowercase letters (a-z)');
    console.log(`Example: ${chalk.dim('abcdefghijklmnopqrstuvwxyzabcdef')}`);
    console.log('');
    process.exit(1);
  }

  // Save extension ID
  configManager.setExtensionId(extensionId.trim());

  console.log('');
  console.log(chalk.green('✓ Extension ID saved!'));
  console.log('');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');

  // Install native messaging host
  console.log(chalk.bold('Step 3: Installing Native Messaging Host'));
  console.log('');

  try {
    await installNativeHost(extensionId.trim(), true);
    console.log(chalk.green('✓ Native Messaging Host installed!'));
    console.log('');
  } catch (error) {
    console.log('');
    console.log(chalk.red('✗ Failed to install Native Messaging Host'));
    console.log('');
    console.log(chalk.yellow('Error:'), error);
    console.log('');
    process.exit(1);
  }

  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log(chalk.bold.green('✓ Installation Complete!'));
  console.log('');
  console.log(chalk.bold('Next steps:'));
  console.log(`1. Reload the extension: ${chalk.cyan('chrome-cmd extension reload')}`);
  console.log(`2. Test the connection: ${chalk.cyan('chrome-cmd tabs list')}`);
  console.log('');
  console.log(chalk.dim('Tip: Check the extension Service Worker logs for connection status'));
  console.log('');
}

async function uninstallExtension(): Promise<void> {
  console.log('');
  console.log(chalk.bold.cyan('╔════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                                                                    ║'));
  console.log(
    chalk.bold.cyan('║') +
      '  ' +
      chalk.bold.yellow('Chrome Extension - Uninstallation') +
      '                          ' +
      chalk.bold.cyan('║')
  );
  console.log(chalk.bold.cyan('║                                                                    ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════════════╝'));
  console.log('');

  const extensionId = configManager.getExtensionId();

  if (!extensionId) {
    console.log(chalk.yellow('⚠  No extension configuration found'));
    console.log('');
    console.log('The extension may not be installed or was installed manually.');
    console.log('');
  }

  // Uninstall native messaging host
  console.log(chalk.bold('Removing Native Messaging Host...'));
  console.log('');

  try {
    await uninstallNativeHost(true);
    console.log(chalk.green('✓ Native Messaging Host removed!'));
    console.log('');
  } catch (_error) {
    console.log('');
    console.log(chalk.yellow('⚠  Could not remove Native Messaging Host'));
    console.log('');
  }

  // Remove extension configuration
  if (extensionId) {
    configManager.clearExtensionId();
    console.log(chalk.green('✓ Extension configuration removed!'));
    console.log('');
  }

  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log(chalk.bold('Manual steps required:'));
  console.log('');
  console.log(`1. Open Chrome and go to: ${chalk.cyan('chrome://extensions/')}`);
  console.log('2. Find the "Chrome CLI" extension');
  console.log('3. Click "Remove" to uninstall the extension');
  console.log('');
  console.log(chalk.dim('The extension must be removed manually from Chrome.'));
  console.log('');
}

export function createExtensionCommand(): Command {
  const extension = new Command('extension').description('Manage Chrome extension').alias('ext');

  extension
    .command('install')
    .description('Install Chrome extension (interactive setup)')
    .action(async () => {
      await installExtension();
    });

  extension
    .command('uninstall')
    .description('Uninstall Chrome extension and remove configuration')
    .action(async () => {
      await uninstallExtension();
    });

  extension
    .command('setup')
    .description('Display setup instructions with extension path')
    .action(() => {
      displaySetup();
    });

  extension
    .command('reload')
    .description('Reload the Chrome extension')
    .action(async () => {
      await reloadExtension();
    });

  extension
    .command('id <extension-id>')
    .description('Save extension ID for quick reload')
    .action((extensionId: string) => {
      setExtensionId(extensionId);
    });

  extension
    .command('info')
    .description('Show extension configuration')
    .action(() => {
      showExtensionInfo();
    });

  extension
    .command('remove')
    .description('Remove saved extension ID')
    .action(() => {
      removeExtensionId();
    });

  return extension;
}
