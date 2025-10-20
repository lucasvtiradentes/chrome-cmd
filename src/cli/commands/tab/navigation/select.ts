import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema, type TabsSelectOptions } from '../../../../shared/commands/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/commands-schema.js';
import { ChromeClient } from '../../../lib/chrome-client.js';
import { profileManager } from '../../../lib/profile-manager.js';

export function createSelectTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_SELECT,
    async (tabIndex: string, _options: TabsSelectOptions) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTab(tabIndex);

        const tabs = await client.listTabs();
        const tab = tabs.find((t) => t.tabId === tabId);

        if (!tab) {
          console.error(chalk.red(`Error: Tab with ID ${tabId} not found`));
          process.exit(1);
        }

        profileManager.setActiveTabId(tabId);

        console.log(chalk.blue('⚡ Starting debugger and logging...'));
        await client.startLogging(tabId);

        console.log(chalk.green('✓ Active tab selected successfully'));
        console.log('');
        console.log(chalk.bold('Active tab:'));
        console.log(`  ${chalk.cyan('ID:')} ${tabId}`);
        console.log(`  ${chalk.cyan('Title:')} ${tab.title || 'Untitled'}`);
        console.log(`  ${chalk.cyan('URL:')} ${tab.url || 'N/A'}`);
        console.log(`  ${chalk.cyan('Debugger:')} ${chalk.green('Attached')}`);
        console.log('');
        console.log(chalk.dim('All subsequent tab commands will use this tab unless --tab is specified'));
        console.log(chalk.dim('Console logs and network requests are now being captured in the background'));
      } catch (error) {
        console.error(chalk.red('Error selecting active tab:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}
