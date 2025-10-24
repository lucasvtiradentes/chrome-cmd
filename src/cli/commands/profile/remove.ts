import { Command } from 'commander';
import { uninstallBridge } from '../../../bridge/installer.js';
import { CommandNames, SubCommandNames } from '../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../protocol/commands/utils.js';
import { APP_NAME } from '../../../shared/constants/constants.js';
import { logger } from '../../../shared/utils/helpers/logger.js';
import { profileManager } from '../../core/managers/profile.js';

async function removeProfile(): Promise<void> {
  const activeProfile = profileManager.getActiveProfile();

  if (!activeProfile) {
    logger.warning('⚠  No active profile');
    logger.newline();
    logger.info('No profile is selected for removal.');
    logger.newline();
    process.exit(1);
  }

  logger.newline();
  logger.bold('Removing profile:');
  logger.info(`  Name: ${activeProfile.profileName}`);
  logger.info(`  Extension ID: ${activeProfile.extensionId}`);
  logger.newline();

  logger.bold('Removing Bridge...');
  logger.newline();

  try {
    await uninstallBridge(true);
    logger.success('✓ Bridge removed!');
    logger.newline();
  } catch (_error) {
    logger.newline();
    logger.warning('⚠  Could not remove Bridge');
    logger.newline();
  }

  profileManager.removeProfile(activeProfile.id);
  logger.success('✓ Profile configuration removed!');
  logger.newline();

  logger.info('─────────────────────────────────────────────────────────────────────');
  logger.newline();
  logger.bold('Manual steps required:');
  logger.newline();
  logger.info('1. Open Chrome and go to: chrome://extensions/');
  logger.info(`2. Find the "${APP_NAME}" extension`);
  logger.info('3. Click "Remove" to uninstall the extension');
  logger.newline();
  logger.dim('The extension must be removed manually from Chrome.');
  logger.newline();
}

export function createProfileRemoveCommand(): Command {
  return createSubCommandFromSchema(CommandNames.PROFILE, SubCommandNames.PROFILE_REMOVE, async () => {
    await removeProfile();
  });
}
