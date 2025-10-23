import { Command } from 'commander';
import type { TabsInputOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema, getSubCommand } from '../../../../shared/commands/utils.js';
import { APP_NAME } from '../../../../shared/constants/constants.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createInputTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_INPUT, async (options: TabsInputOptions) => {
    try {
      const schema = getSubCommand(CommandNames.TAB, SubCommandNames.TAB_INPUT);
      const selectorFlag = schema?.flags?.find((f) => f.name === '--selector');
      const valueFlag = schema?.flags?.find((f) => f.name === '--value');
      const tabFlag = schema?.flags?.find((f) => f.name === '--tab');

      if (!options.selector) {
        logger.error(`Error: ${selectorFlag?.name} is required`);
        logger.info(
          `Usage: ${APP_NAME} tabs input ${selectorFlag?.name} "<css-selector>" ${valueFlag?.name} "<value>" [${tabFlag?.name} <tabIndex>]`
        );
        process.exit(1);
      }

      if (!options.value) {
        logger.error(`Error: ${valueFlag?.name} is required`);
        logger.info(
          `Usage: ${APP_NAME} tabs input ${selectorFlag?.name} "<css-selector>" ${valueFlag?.name} "<value>" [${tabFlag?.name} <tabIndex>]`
        );
        process.exit(1);
      }

      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());

      await client.fillInput(tabId, options.selector, options.value, options.submit || false);

      logger.success('✓ Input field filled successfully');
      logger.dim(`  Selector: ${options.selector}`);
      logger.dim(`  Value: ${options.value}`);
      if (options.submit) {
        logger.dim(`  Submit: Enter key pressed`);
      }
    } catch (error) {
      logger.error('Error filling input:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
}
