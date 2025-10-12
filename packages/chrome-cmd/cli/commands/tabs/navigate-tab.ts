import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createNavigateTabCommand(): Command {
  const navigateTab = new Command('navigate');
  navigateTab
    .description('Navigate a tab to a specific URL')
    .argument('<url>', 'URL to navigate to')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .action(async (url: string, options: { tab?: string }) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);
        await client.navigateTab(tabId, url);

        console.log(chalk.green(`✓ Navigated to ${url}`));
      } catch (error) {
        console.error(chalk.red('Error navigating tab:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return navigateTab;
}
