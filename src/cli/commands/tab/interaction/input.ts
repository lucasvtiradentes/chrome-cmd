import { Command } from 'commander';
import type { TabsInputOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema, getSubCommand } from '../../../../shared/commands/utils.js';
import { APP_NAME } from '../../../../shared/constants/constants.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logErrorAndExit } from '../../../../shared/utils/functions/log-error-and-exit.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createInputTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_INPUT, async (options: TabsInputOptions) => {
    const commandPromise = async () => {
      const schema = getSubCommand(CommandNames.TAB, SubCommandNames.TAB_INPUT);
      const selectorFlag = schema?.flags?.find((f) => f.name === '--selector');
      const valueFlag = schema?.flags?.find((f) => f.name === '--value');
      const tabFlag = schema?.flags?.find((f) => f.name === '--tab');

      if (!options.selector) {
        logErrorAndExit(
          `${selectorFlag?.name} is required\n\nUsage: ${APP_NAME} tabs input ${selectorFlag?.name} "<css-selector>" ${valueFlag?.name} "<value>" [${tabFlag?.name} <tabIndex>]`
        );
      }

      if (!options.value) {
        logErrorAndExit(
          `${valueFlag?.name} is required\n\nUsage: ${APP_NAME} tabs input ${selectorFlag?.name} "<css-selector>" ${valueFlag?.name} "<value>" [${tabFlag?.name} <tabIndex>]`
        );
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
    };

    await commandPromise().catch(commandErrorHandler('Error filling input:'));
  });
}
