import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createCloseTabCommand(): Command {
  const closeTab = new Command('close');
  closeTab
    .description('Close a specific tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .action(async (options: { tab?: string }) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);
        await client.closeTab(tabId);

        console.log(chalk.green(`✓ Tab closed successfully`));
      } catch (error) {
        console.error(chalk.red('Error closing tab:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return closeTab;
}
