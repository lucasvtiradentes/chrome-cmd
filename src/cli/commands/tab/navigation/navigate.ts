import chalk from 'chalk';
import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/cli-command.js';
import type { TabsNavigateOptions } from '../../../../shared/commands/commands-schemas.js';
import { createSubCommandFromSchema } from '../../../../shared/utils/helpers/command-builder.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createNavigateTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_NAVIGATE,
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
