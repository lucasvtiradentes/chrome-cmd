import chalk from 'chalk';
import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/cli-command.js';
import type { TabsFocusOptions } from '../../../../shared/commands/commands-schemas.js';
import { createSubCommandFromSchema } from '../../../../shared/utils/command-builder.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createFocusTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_FOCUS, async (options: TabsFocusOptions) => {
    try {
      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());

      const tabs = await client.listTabs();
      const tab = tabs.find((t) => t.tabId === tabId);

      if (!tab) {
        console.error(chalk.red(`Error: Tab with ID ${tabId} not found`));
        process.exit(1);
      }

      await client.activateTab(tabId);

      console.log(chalk.green('✓ Tab focused successfully'));
      console.log('');
      console.log(chalk.bold('Focused tab:'));
      console.log(`  ${chalk.cyan('ID:')} ${tabId}`);
      console.log(`  ${chalk.cyan('Title:')} ${tab.title || 'Untitled'}`);
      console.log(`  ${chalk.cyan('URL:')} ${tab.url || 'N/A'}`);
    } catch (error) {
      console.error(chalk.red('Error focusing tab:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
}
