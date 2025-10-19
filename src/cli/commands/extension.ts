import * as readline from 'node:readline';
import chalk from 'chalk';
import { Command } from 'commander';
import { createCommandFromSchema, createSubCommandFromSchema } from '../../shared/command-builder.js';
import { CommandNames, SubCommandNames } from '../../shared/commands-schema.js';
import { APP_NAME } from '../../shared/constants.js';
import { configManager } from '../lib/config-manager.js';
import { installNativeHost, uninstallNativeHost } from '../lib/host-utils.js';

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

async function removeExtension(): Promise<void> {
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
    createSubCommandFromSchema(CommandNames.EXTENSION, SubCommandNames.EXTENSION_REMOVE, async () => {
      await removeExtension();
    })
  );

  extension.addCommand(
    createSubCommandFromSchema(CommandNames.EXTENSION, SubCommandNames.EXTENSION_SELECT, async () => {
      await selectExtension();
    })
  );

  return extension;
}
