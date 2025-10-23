import { Command } from 'commander';
import type { TabsRefreshOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../shared/commands/utils.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createRefreshTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_REFRESH,
    async (options: TabsRefreshOptions) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        await client.reloadTab(tabId);

        logger.success(`✓ Tab refreshed successfully`);
      } catch (error) {
        logger.error('Error refreshing tab:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}
