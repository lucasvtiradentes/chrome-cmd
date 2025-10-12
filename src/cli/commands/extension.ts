import chalk from 'chalk';
import { Command } from 'commander';
import { APP_NAME } from '../../shared/constants.js';
import { configManager } from '../lib/config-manager.js';
import { getExtensionPath, installNativeHost, promptExtensionId, uninstallNativeHost } from '../lib/host-utils.js';

async function reloadExtension(): Promise<void> {
  try {
    console.log('');
    console.log(chalk.blue('🔄 Reloading Chrome extension...'));
    console.log('');

    const { ExtensionClient } = await import('../lib/extension-client.js');
    const { ChromeCommand } = await import('../../shared/commands.js');

    const client = new ExtensionClient();

    try {
      await client.sendCommand(ChromeCommand.PING);
      console.log(chalk.dim('✓ Extension is connected'));
      console.log('');
    } catch (_error) {
      throw new Error('Extension is not connected. Make sure it is loaded and connected to the mediator.');
    }

    console.log(chalk.dim('Sending reload command...'));
    console.log('');

    try {
      await client.sendCommand(ChromeCommand.RELOAD_EXTENSION);

      console.log(chalk.green('✓ Extension reloaded successfully!'));
      console.log('');
    } catch (error) {
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

  if (!/^[a-z]{32}$/.test(extensionId.trim())) {
    console.log('');
    console.log(chalk.red('✗ Invalid extension ID format'));
    console.log('');
    console.log('Extension IDs should be 32 lowercase letters (a-z)');
    console.log(`Example: ${chalk.dim('abcdefghijklmnopqrstuvwxyzabcdef')}`);
    console.log('');
    process.exit(1);
  }

  configManager.setExtensionId(extensionId.trim());

  console.log('');
  console.log(chalk.green('✓ Extension ID saved!'));
  console.log('');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');

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
  console.log(`1. Reload the extension: ${chalk.cyan(`${APP_NAME} extension reload`)}`);
  console.log(`2. Test the connection: ${chalk.cyan(`${APP_NAME} tabs list`)}`);
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
    .command('reload')
    .description('Reload the Chrome extension')
    .action(async () => {
      await reloadExtension();
    });

  return extension;
}
