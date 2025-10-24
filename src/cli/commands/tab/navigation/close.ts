import { Command } from 'commander';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import type { TabsCloseOptions } from '../../../schemas/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../../schemas/utils.js';

export function createCloseTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_CLOSE, async (options: TabsCloseOptions) => {
    const commandPromise = async () => {
      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());
      await client.closeTab(tabId);

      logger.success(`✓ Tab closed successfully`);
    };

    await commandPromise().catch(commandErrorHandler('Error closing tab:'));
  });
}
