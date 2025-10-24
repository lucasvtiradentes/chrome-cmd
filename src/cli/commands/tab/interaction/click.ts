import { Command } from 'commander';
import { CLI_NAME } from '../../../../shared/constants/constants.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import type { TabsClickOptions } from '../../../schemas/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../schemas/definitions.js';
import { createSubCommandFromSchema, getSubCommand } from '../../../schemas/utils.js';
import { logErrorAndExit } from '../../../utils/log-error-and-exit.js';

export function createClickTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_CLICK, async (options: TabsClickOptions) => {
    const commandPromise = async () => {
      const schema = getSubCommand(CommandNames.TAB, SubCommandNames.TAB_CLICK);
      const selectorFlag = schema?.flags?.find((f) => f.name === '--selector');
      const textFlag = schema?.flags?.find((f) => f.name === '--text');
      const tabFlag = schema?.flags?.find((f) => f.name === '--tab');

      if (!options.selector && !options.text) {
        logErrorAndExit(
          `Either --selector or --text is required\n\nUsage: ${CLI_NAME} tabs click ${selectorFlag?.name} "<css-selector>" [${tabFlag?.name} --tab <index>]\n   or: ${CLI_NAME} tabs click ${textFlag?.name} "<text-content>" [${tabFlag?.name} --tab <index>]`
        );
      }

      if (options.selector && options.text) {
        logErrorAndExit('Cannot use both --selector and --text at the same time');
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
    };

    await commandPromise().catch(commandErrorHandler('Error clicking element:'));
  });
}
