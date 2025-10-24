import { Command } from 'commander';
import type { TabsInputOptions } from '../../../../protocol/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema, getSubCommand } from '../../../../protocol/commands/utils.js';
import { CLI_NAME } from '../../../../shared/constants/constants.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import { logErrorAndExit } from '../../../utils/log-error-and-exit.js';

export function createInputTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_INPUT, async (options: TabsInputOptions) => {
    const commandPromise = async () => {
      const schema = getSubCommand(CommandNames.TAB, SubCommandNames.TAB_INPUT);
      const selectorFlag = schema?.flags?.find((f) => f.name === '--selector');
      const valueFlag = schema?.flags?.find((f) => f.name === '--value');
      const tabFlag = schema?.flags?.find((f) => f.name === '--tab');

      if (!options.selector) {
        logErrorAndExit(
          `${selectorFlag?.name} is required\n\nUsage: ${CLI_NAME} tabs input ${selectorFlag?.name} "<css-selector>" ${valueFlag?.name} "<value>" [${tabFlag?.name} <tabIndex>]`
        );
      }

      if (!options.value) {
        logErrorAndExit(
          `${valueFlag?.name} is required\n\nUsage: ${CLI_NAME} tabs input ${selectorFlag?.name} "<css-selector>" ${valueFlag?.name} "<value>" [${tabFlag?.name} <tabIndex>]`
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
