import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createRefreshTabCommand(): Command {
  const refreshTab = new Command('refresh');
  refreshTab
    .description('Reload/refresh a specific tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .action(async (options: { tab?: string }) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);
        await client.reloadTab(tabId);

        console.log(chalk.green(`✓ Tab refreshed successfully`));
      } catch (error) {
        console.error(chalk.red('Error refreshing tab:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return refreshTab;
}
