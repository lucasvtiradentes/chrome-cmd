import chalk from 'chalk';
import { Command } from 'commander';
import type { TabsCloseOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../shared/commands/utils.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createCloseTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_CLOSE, async (options: TabsCloseOptions) => {
    try {
      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());
      await client.closeTab(tabId);

      console.log(chalk.green(`✓ Tab closed successfully`));
    } catch (error) {
      console.error(chalk.red('Error closing tab:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
}
