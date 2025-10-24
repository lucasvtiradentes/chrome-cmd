import { Command } from 'commander';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import type { TabsCreateOptions } from '../../../schemas/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../../schemas/utils.js';

export function createCreateTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_CREATE,
    async (url: string | undefined, options: TabsCreateOptions) => {
      const commandPromise = async () => {
        const client = new ChromeClient();
        const active = !options.background;
        const tab = await client.createTab(url, active);

        logger.success('✓ Tab created successfully');
        logger.dim(`  Tab ID: ${tab.tabId}`);
        logger.dim(`  URL: ${tab.url}`);
      };

      await commandPromise().catch(commandErrorHandler('Error creating tab:'));
    }
  );
}
