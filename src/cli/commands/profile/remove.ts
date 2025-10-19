import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema } from '../../../shared/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands-schema.js';
import { configManager } from '../../lib/config-manager.js';
import { uninstallNativeHost } from '../../lib/host-utils.js';

async function removeProfile(): Promise<void> {
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

export function createProfileRemoveCommand(): Command {
  return createSubCommandFromSchema(CommandNames.PROFILE, SubCommandNames.PROFILE_REMOVE, async () => {
    await removeProfile();
  });
}
