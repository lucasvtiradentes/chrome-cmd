import * as readline from 'node:readline';
import chalk from 'chalk';
import { Command } from 'commander';
import { createCommandFromSchema, createSubCommandFromSchema } from '../../shared/command-builder.js';
import { ChromeCommand } from '../../shared/commands.js';
import { CommandNames, SubCommandNames } from '../../shared/commands-schema.js';
import { APP_NAME } from '../../shared/constants.js';
import { configManager } from '../lib/config-manager.js';
import { ExtensionClient } from '../lib/extension-client.js';
import { getExtensionPath, installNativeHost, uninstallNativeHost } from '../lib/host-utils.js';

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

  console.log(chalk.bold('Step 2: Profile Configuration'));
  console.log('');
  console.log('Give this Chrome profile a name (e.g., "Work", "Personal", "Testing")');
  console.log('');

  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const profileName = await new Promise<string>((resolve) => {
    rl.question(chalk.cyan('Profile name: '), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!profileName || profileName.length === 0) {
    console.log('');
    console.log(chalk.red('✗ Profile name is required'));
    console.log('');
    process.exit(1);
  }

  console.log('');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');

  console.log(chalk.bold('Step 3: Enter Extension ID'));
  console.log('');
  console.log('After loading the extension, copy its ID from chrome://extensions/');
  console.log(chalk.dim('(Extension IDs are 32 lowercase letters)'));
  console.log('');

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const extensionId = await new Promise<string>((resolve) => {
    rl.question(chalk.cyan('Extension ID: '), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

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

  console.log('');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');

  console.log(chalk.bold('Step 4: Installing Native Messaging Host'));
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

  const profileId = configManager.createProfile(profileName, trimmedId, extensionPath);

  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log(chalk.bold.green('✓ Installation Complete!'));
  console.log('');
  console.log(chalk.bold('Profile created:'));
  console.log(`  ${chalk.cyan('ID:')} ${chalk.dim(profileId)}`);
  console.log(`  ${chalk.cyan('Name:')} ${profileName}`);
  console.log(`  ${chalk.cyan('Extension ID:')} ${trimmedId}`);
  console.log('');
  console.log(chalk.bold('Next steps:'));
  console.log(`1. Test the connection: ${chalk.cyan(`${APP_NAME} tabs list`)}`);
  console.log('');
}

async function selectExtension(): Promise<void> {
  const profiles = configManager.getAllProfiles();
  const activeProfileId = configManager.getActiveProfileId();

  if (profiles.length === 0) {
    console.log('');
    console.log(chalk.yellow('⚠  No profiles installed'));
    console.log('');
    console.log(`Run ${chalk.cyan(`${APP_NAME} extension install`)} to install a profile first.`);
    console.log('');
    process.exit(1);
  }

  console.log('');
  console.log(chalk.bold('Installed Profiles:'));
  console.log('');

  profiles.forEach((profile, index: number) => {
    const isActive = profile.id === activeProfileId;
    const marker = isActive ? chalk.green('●') : chalk.dim('○');
    const status = isActive ? chalk.green(' (active)') : '';

    console.log(`${marker} ${chalk.bold(index + 1)}. ${chalk.bold.cyan(profile.profileName)}${status}`);
    console.log(`   ${chalk.dim(`Profile ID: ${profile.id}`)}`);
    console.log(`   ${chalk.dim(`Extension ID: ${profile.extensionId}`)}`);
    console.log('');
  });

  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const choice = await new Promise<string>((resolve) => {
    rl.question(chalk.cyan('Select profile (number, name, or ID): '), (answer) => {
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

  let selectedProfileId: string | null = null;

  const indexChoice = Number.parseInt(choice, 10);
  if (!Number.isNaN(indexChoice) && indexChoice >= 1 && indexChoice <= profiles.length) {
    selectedProfileId = profiles[indexChoice - 1].id;
  } else {
    const match = profiles.find(
      (p) => p.profileName.toLowerCase() === choice.toLowerCase() || p.id === choice || p.extensionId === choice
    );
    if (match) {
      selectedProfileId = match.id;
    }
  }

  if (!selectedProfileId) {
    console.log('');
    console.log(chalk.red('✗ Invalid selection'));
    console.log('');
    console.log('Please enter a valid number, profile name, or ID.');
    console.log('');
    process.exit(1);
  }

  const success = configManager.selectProfile(selectedProfileId);

  if (success) {
    const profile = configManager.getProfileById(selectedProfileId)!;

    console.log('');
    console.log(chalk.green('✓ Profile selected successfully!'));
    console.log('');
    console.log(`  ${chalk.cyan('Name:')} ${profile.profileName}`);
    console.log(`  ${chalk.cyan('Profile ID:')} ${chalk.dim(profile.id)}`);
    console.log(`  ${chalk.cyan('Extension ID:')} ${profile.extensionId}`);
    console.log('');

    try {
      await installNativeHost(profile.extensionId, true);
      console.log(chalk.dim('Native messaging host updated'));
      console.log('');
    } catch {
      console.log(chalk.yellow('⚠  Failed to update native messaging host'));
      console.log('');
    }
  } else {
    console.log('');
    console.log(chalk.red('✗ Failed to select profile'));
    console.log('');
    process.exit(1);
  }
}

async function uninstallExtension(): Promise<void> {
  const activeProfile = configManager.getActiveProfile();

  if (!activeProfile) {
    console.log(chalk.yellow('⚠  No active profile'));
    console.log('');
    console.log('No profile is selected for removal.');
    console.log('');
    process.exit(1);
  }

  console.log('');
  console.log(chalk.bold('Removing profile:'));
  console.log(`  ${chalk.cyan('Name:')} ${activeProfile.profileName}`);
  console.log(`  ${chalk.cyan('Extension ID:')} ${activeProfile.extensionId}`);
  console.log('');

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

  configManager.removeProfile(activeProfile.id);
  console.log(chalk.green('✓ Profile configuration removed!'));
  console.log('');

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
