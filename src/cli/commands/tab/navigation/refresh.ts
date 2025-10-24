import { Command } from 'commander';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import type { TabsRefreshOptions } from '../../../schemas/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../../schemas/utils.js';

export function createRefreshTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_REFRESH,
    async (options: TabsRefreshOptions) => {
      const commandPromise = async () => {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        await client.reloadTab(tabId);

        logger.success(`✓ Tab refreshed successfully`);
      };

      await commandPromise().catch(commandErrorHandler('Error refreshing tab:'));
    }
  );
}
