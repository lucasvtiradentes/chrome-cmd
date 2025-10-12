import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema } from '../../../shared/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands-schema.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createListTabsCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TABS, SubCommandNames.TABS_LIST, async () => {
    try {
      const client = new ChromeClient();
      const tabs = await client.listTabs();

      if (tabs.length === 0) {
        console.log(chalk.yellow('No tabs found'));
        return;
      }

      console.log(chalk.bold(`\nFound ${tabs.length} tab(s):\n`));

      for (const tab of tabs) {
        const prefix = tab.active ? chalk.green('●') : chalk.gray('○');
        const tabId = chalk.cyan(`[${tab.tabId}]`);
        const title = chalk.white(tab.title);
        const url = chalk.gray(tab.url);

        console.log(`${prefix} ${tabId} ${title}`);
        console.log(`  ${url}\n`);
      }
    } catch (error) {
      console.error(chalk.red('Error listing tabs:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
}
