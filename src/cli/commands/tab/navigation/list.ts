import { Command } from 'commander';
import { colors } from '../../../../shared/utils/helpers/colors.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import { CommandNames, SubCommandNames } from '../../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../../schemas/utils.js';

export function createListTabsCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_LIST, async () => {
    const commandPromise = async () => {
      const client = new ChromeClient();
      const tabs = await client.listTabs();

      if (tabs.length === 0) {
        logger.warning('No tabs found');
        return;
      }

      logger.bold(`\nFound ${tabs.length} tab(s):\n`);

      for (const tab of tabs) {
        const prefix = tab.active ? colors.green('●') : colors.dim('○');
        const tabId = colors.cyan(`[${tab.tabId}]`);
        const title = tab.title ?? '';
        const url = colors.dim(tab.url ?? '');

        logger.info(`${prefix} ${tabId} ${title}`);
        logger.info(`  ${url}\n`);
      }
    };

    await commandPromise().catch(commandErrorHandler('Error listing tabs:'));
  });
}
