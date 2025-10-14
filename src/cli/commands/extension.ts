import * as readline from 'node:readline';
import chalk from 'chalk';
import { Command } from 'commander';
import { createCommandFromSchema, createSubCommandFromSchema } from '../../shared/command-builder.js';
import { ChromeCommand } from '../../shared/commands.js';
import { CommandNames, SubCommandNames } from '../../shared/commands-schema.js';
import { APP_NAME } from '../../shared/constants.js';
import { configManager, type ExtensionInfo } from '../lib/config-manager.js';
import { ExtensionClient } from '../lib/extension-client.js';
import { getExtensionPath, installNativeHost, promptExtensionId, uninstallNativeHost } from '../lib/host-utils.js';

async function reloadExtension(): Promise<void> {
  try {
    console.log('');
    console.log(chalk.blue('🔄 Reloading Chrome extension...'));
    console.log('');

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

  const trimmedId = extensionId.trim();

  // Set as active extension (this also adds to the list automatically)
  configManager.setExtensionId(trimmedId);

  console.log('');
  console.log(chalk.green('✓ Extension ID saved!'));
  console.log('');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');

  console.log(chalk.bold('Step 3: Installing Native Messaging Host'));
  console.log('');

  try {
    await installNativeHost(trimmedId, true);
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
  console.log(`1. Test the connection: ${chalk.cyan(`${APP_NAME} tabs list`)}`);
  console.log('');
}

async function selectExtension(): Promise<void> {
  const extensions = configManager.getAllExtensions();
  const currentExtensionId = configManager.getExtensionId();

  if (extensions.length === 0) {
    console.log('');
    console.log(chalk.yellow('⚠  No extensions installed'));
    console.log('');
    console.log(`Run ${chalk.cyan(`${APP_NAME} extension install`)} to install an extension first.`);
    console.log('');
    process.exit(1);
  }

  console.log('');
  console.log(chalk.bold('Installed Extensions:'));
  console.log('');

  extensions.forEach((ext: ExtensionInfo, index: number) => {
    const isActive = ext.id === currentExtensionId;
    const marker = isActive ? chalk.green('●') : chalk.dim('○');
    const status = isActive ? chalk.green(' (active)') : '';
    const date = new Date(ext.installedAt).toLocaleDateString();

    console.log(`${marker} ${chalk.bold(index + 1)}. ${chalk.cyan(ext.id)}${status}`);
    console.log(`   ${chalk.dim(`Installed: ${date}`)}`);
    console.log('');
  });

  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const choice = await new Promise<string>((resolve) => {
    rl.question(chalk.cyan('Select extension (number or ID): '), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!choice) {
    console.log('');
    console.log(chalk.yellow('✗ No selection made'));
    console.log('');
    process.exit(1);
  }

  let selectedId: string | null = null;

  // Check if input is a number (index)
  const indexChoice = Number.parseInt(choice, 10);
  if (!Number.isNaN(indexChoice) && indexChoice >= 1 && indexChoice <= extensions.length) {
    selectedId = extensions[indexChoice - 1].id;
  } else {
    // Check if input is a valid extension ID
    const matchingExt = extensions.find((ext) => ext.id === choice);
    if (matchingExt) {
      selectedId = matchingExt.id;
    }
  }

  if (!selectedId) {
    console.log('');
    console.log(chalk.red('✗ Invalid selection'));
    console.log('');
    console.log('Please enter a valid number or extension ID.');
    console.log('');
    process.exit(1);
  }

  const success = configManager.selectExtension(selectedId);

  if (success) {
    console.log('');
    console.log(chalk.green('✓ Extension selected successfully!'));
    console.log('');
    console.log(`Active extension: ${chalk.cyan(selectedId)}`);
    console.log('');

    // Update native host manifest for the new extension
    try {
      await installNativeHost(selectedId, true);
      console.log(chalk.dim('Native messaging host updated'));
      console.log('');
    } catch {
      console.log(chalk.yellow('⚠  Failed to update native messaging host'));
      console.log('');
    }
  } else {
    console.log('');
    console.log(chalk.red('✗ Failed to select extension'));
    console.log('');
    process.exit(1);
  }
}

async function uninstallExtension(): Promise<void> {
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
    // Remove from extensions list
    configManager.removeExtension(extensionId);
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
  const extension = createCommandFromSchema(CommandNames.EXTENSION);

  extension.addCommand(
    createSubCommandFromSchema(CommandNames.EXTENSION, SubCommandNames.EXTENSION_INSTALL, async () => {
      await installExtension();
    })
  );

  extension.addCommand(
    createSubCommandFromSchema(CommandNames.EXTENSION, SubCommandNames.EXTENSION_UNINSTALL, async () => {
      await uninstallExtension();
    })
  );

  extension.addCommand(
    createSubCommandFromSchema(CommandNames.EXTENSION, SubCommandNames.EXTENSION_RELOAD, async () => {
      await reloadExtension();
    })
  );

  extension.addCommand(
    createSubCommandFromSchema(CommandNames.EXTENSION, SubCommandNames.EXTENSION_SELECT, async () => {
      await selectExtension();
    })
  );

  return extension;
}
