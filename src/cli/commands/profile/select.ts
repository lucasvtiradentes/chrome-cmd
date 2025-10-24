import * as readline from 'node:readline';
import { Command } from 'commander';
import { installBridge } from '../../../bridge/installer.js';
import { logger } from '../../../shared/utils/helpers/logger.js';
import { profileManager } from '../../core/managers/profile.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

async function selectProfile(): Promise<void> {
  const profiles = profileManager.getAllProfiles();
  const activeProfileId = profileManager.getActiveProfileId();

  if (profiles.length === 0) {
    logger.newline();
    logger.warning('⚠  No profiles configured');
    logger.newline();
    logger.info('You need to configure a profile first. See installation documentation.');
    logger.newline();
    process.exit(1);
  }

  logger.newline();
  logger.bold('Installed Profiles:');
  logger.newline();

  profiles.forEach((profile, index: number) => {
    const isActive = profile.id === activeProfileId;
    const marker = isActive ? '●' : '○';
    const status = isActive ? ' (active)' : '';

    logger.info(`${marker} ${index + 1}. ${profile.profileName}${status}`);
    logger.dim(`   Profile ID: ${profile.id}`);
    logger.dim(`   Extension ID: ${profile.extensionId}`);
    logger.newline();
  });

  logger.info('─────────────────────────────────────────────────────────────────────');
  logger.newline();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const choice = await new Promise<string>((resolve) => {
    rl.question('Select profile (number or profile ID): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!choice) {
    logger.newline();
    logger.warning('✗ No selection made');
    logger.newline();
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
    logger.newline();
    logger.error('✗ Invalid selection');
    logger.newline();
    logger.info('Please enter a valid number, profile name, or ID.');
    logger.newline();
    process.exit(1);
  }

  const success = profileManager.selectProfile(selectedProfileId);

  if (success) {
    const profile = profileManager.getProfileById(selectedProfileId);
    if (!profile) {
      logger.newline();
      logger.error('✗ Failed to get profile details');
      logger.newline();
      process.exit(1);
    }

    logger.newline();
    logger.success('✓ Profile selected successfully!');
    logger.newline();
    logger.info(`  Name: ${profile.profileName}`);
    logger.dim(`  Profile ID: ${profile.id}`);
    logger.info(`  Extension ID: ${profile.extensionId}`);
    logger.newline();

    try {
      await installBridge(profile.extensionId, true);
      logger.dim('Bridge updated');
      logger.newline();
    } catch {
      logger.warning('⚠  Failed to update bridge');
      logger.newline();
    }
  } else {
    logger.newline();
    logger.error('✗ Failed to select profile');
    logger.newline();
    process.exit(1);
  }
}

export function createProfileSelectCommand(): Command {
  return createSubCommandFromSchema(CommandNames.PROFILE, SubCommandNames.PROFILE_SELECT, async () => {
    await selectProfile();
  });
}
