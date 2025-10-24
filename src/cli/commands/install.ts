import * as readline from 'node:readline';
import { Command } from 'commander';
import { getExtensionPath, installBridge } from '../../bridge/installer.js';
import { APP_NAME } from '../../shared/constants/constants.js';
import { logger } from '../../shared/utils/helpers/logger.js';
import { CommandNames } from '../schemas/definitions.js';
import { createCommandFromSchema } from '../schemas/utils.js';

export function createInstallCommand(): Command {
  return createCommandFromSchema(CommandNames.INSTALL).action(async () => {
    const extensionPath = getExtensionPath();

    if (!extensionPath) {
      logger.newline();
      logger.error('✗ Chrome extension not found');
      logger.newline();
      logger.info('The extension should be bundled with the CLI package.');
      logger.newline();
      process.exit(1);
    }

    logger.newline();
    logger.bold(`${APP_NAME} Installation`);
    logger.newline();
    logger.bold('Extension Path:');
    logger.success(extensionPath);
    logger.newline();
    logger.info('─────────────────────────────────────────────────────────────────────');
    logger.newline();
    logger.bold('Installation Steps:');
    logger.newline();
    logger.info('Step 1: Load the Chrome extension');
    logger.info('  • Open Chrome: chrome://extensions/');
    logger.info('  • Enable "Developer mode" (top right)');
    logger.info('  • Click "Load unpacked" and select the folder above');
    logger.newline();
    logger.info('Step 2: Copy the Extension ID');
    logger.info('  • Find the extension ID shown below the extension name');
    logger.dim('  • It looks like: abcdefghijklmnopqrstuvwxyzabcdef');
    logger.newline();
    logger.info('─────────────────────────────────────────────────────────────────────');
    logger.newline();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const extensionId = await new Promise<string>((resolve) => {
      rl.question('Paste the Extension ID here: ', (answer: string) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (!extensionId || extensionId.length !== 32) {
      logger.newline();
      logger.error('✗ Invalid Extension ID');
      logger.newline();
      logger.info('Extension ID must be exactly 32 characters.');
      logger.newline();
      process.exit(1);
    }

    await installBridge(extensionId);

    logger.success('✓ Installation complete!');
    logger.newline();
    logger.info(`${APP_NAME} is now ready to use!`);
    logger.info('Try running: chrome-cmd tab list');
    logger.newline();
    logger.dim('💡 Tip: You can register multiple extensions (different profiles)');
    logger.dim('   Just run this command again with a different Extension ID');
    logger.newline();
  });
}
