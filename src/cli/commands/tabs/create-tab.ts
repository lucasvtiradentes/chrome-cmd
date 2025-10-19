import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema, type TabsCreateOptions } from '../../../shared/commands/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands/commands-schema.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createCreateTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TABS,
    SubCommandNames.TABS_CREATE,
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
