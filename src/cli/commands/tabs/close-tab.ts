import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema, type TabsCloseOptions } from '../../../shared/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands-schema.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createCloseTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TABS,
    SubCommandNames.TABS_CLOSE,
    async (options: TabsCloseOptions) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        await client.closeTab(tabId);

        console.log(chalk.green(`✓ Tab closed successfully`));
      } catch (error) {
        console.error(chalk.red('Error closing tab:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}
