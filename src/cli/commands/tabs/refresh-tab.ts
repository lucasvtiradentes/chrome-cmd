import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema, type TabsRefreshOptions } from '../../../shared/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands-schema.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createRefreshTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TABS,
    SubCommandNames.TABS_REFRESH,
    async (options: TabsRefreshOptions) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        await client.reloadTab(tabId);

        console.log(chalk.green(`✓ Tab refreshed successfully`));
      } catch (error) {
        console.error(chalk.red('Error refreshing tab:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}
