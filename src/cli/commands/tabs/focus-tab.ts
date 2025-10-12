import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createFocusTabCommand(): Command {
  const focusTab = new Command('focus');
  focusTab
    .description('Focus/activate a specific tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .action(async (options: { tab?: string }) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);

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

  return focusTab;
}
