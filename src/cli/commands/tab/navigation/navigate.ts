import { Command } from 'commander';
import type { TabsNavigateOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../shared/commands/utils.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

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
