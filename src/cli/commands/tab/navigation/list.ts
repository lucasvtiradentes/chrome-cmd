import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../protocol/commands/utils.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';

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
        const prefix = tab.active ? logger.success('●') : logger.dim('○');
        const tabId = logger.cyan(`[${tab.tabId}]`);
        const title = logger.info(tab.title ?? '');
        const url = logger.dim(tab.url ?? '');

        logger.info(`${prefix} ${tabId} ${title}`);
        logger.info(`  ${url}\n`);
      }
    };

    await commandPromise().catch(commandErrorHandler('Error listing tabs:'));
  });
}
