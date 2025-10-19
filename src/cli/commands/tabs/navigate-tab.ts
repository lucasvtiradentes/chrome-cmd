import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema, type TabsNavigateOptions } from '../../../shared/commands/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands/commands-schema.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createNavigateTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TABS,
    SubCommandNames.TABS_NAVIGATE,
    async (url: string, options: TabsNavigateOptions) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        await client.navigateTab(tabId, url);

        console.log(chalk.green(`✓ Navigated to ${url}`));
      } catch (error) {
        console.error(chalk.red('Error navigating tab:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}
