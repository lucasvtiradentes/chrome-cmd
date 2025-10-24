import { Command } from 'commander';
import type { TabsRefreshOptions } from '../../../../protocol/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../protocol/commands/utils.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';

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
