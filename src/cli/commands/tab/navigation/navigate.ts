import { Command } from 'commander';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import type { TabsNavigateOptions } from '../../../schemas/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../../schemas/utils.js';

export function createNavigateTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_NAVIGATE,
    async (url: string, options: TabsNavigateOptions) => {
      const commandPromise = async () => {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        await client.navigateTab(tabId, url);

        logger.success(`✓ Navigated to ${url}`);
      };

      await commandPromise().catch(commandErrorHandler('Error navigating tab:'));
    }
  );
}
