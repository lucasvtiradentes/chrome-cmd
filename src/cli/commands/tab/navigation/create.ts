import chalk from 'chalk';
import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/cli-command.js';
import type { TabsCreateOptions } from '../../../../shared/commands/protocol-command.js';
import { createSubCommandFromSchema } from '../../../../shared/utils/helpers/command-builder.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createCreateTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_CREATE,
    async (url: string | undefined, options: TabsCreateOptions) => {
      try {
        const client = new ChromeClient();
        const active = !options.background;
        const tab = await client.createTab(url, active);

        console.log(chalk.green('✓ Tab created successfully'));
        console.log(chalk.gray(`  Tab ID: ${tab.tabId}`));
        console.log(chalk.gray(`  URL: ${tab.url}`));
      } catch (error) {
        console.error(chalk.red('Error creating tab:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}
