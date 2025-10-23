import { Command } from 'commander';
import type { TabsClickOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema, getSubCommand } from '../../../../shared/commands/utils.js';
import { APP_NAME } from '../../../../shared/constants/constants.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createClickTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_CLICK, async (options: TabsClickOptions) => {
    try {
      const schema = getSubCommand(CommandNames.TAB, SubCommandNames.TAB_CLICK);
      const selectorFlag = schema?.flags?.find((f) => f.name === '--selector');
      const textFlag = schema?.flags?.find((f) => f.name === '--text');
      const tabFlag = schema?.flags?.find((f) => f.name === '--tab');

      if (!options.selector && !options.text) {
        logger.error('Error: Either --selector or --text is required');
        logger.info(
          `Usage: ${APP_NAME} tabs click ${selectorFlag?.name} "<css-selector>" [${tabFlag?.name} <tabIndex>]`
        );
        logger.info(`   or: ${APP_NAME} tabs click ${textFlag?.name} "<text-content>" [${tabFlag?.name} <tabIndex>]`);
        process.exit(1);
      }

      if (options.selector && options.text) {
        logger.error('Error: Cannot use both --selector and --text at the same time');
        process.exit(1);
      }

      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());

      if (options.text) {
        await client.clickElementByText(tabId, options.text);
        logger.success('✓ Element clicked successfully');
        logger.dim(`  Text: ${options.text}`);
      } else if (options.selector) {
        await client.clickElement(tabId, options.selector);
        logger.success('✓ Element clicked successfully');
        logger.dim(`  Selector: ${options.selector}`);
      }
    } catch (error) {
      logger.error('Error clicking element:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
}
