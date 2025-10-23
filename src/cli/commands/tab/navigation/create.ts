import { Command } from 'commander';
import type { TabsCreateOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../shared/commands/utils.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

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
