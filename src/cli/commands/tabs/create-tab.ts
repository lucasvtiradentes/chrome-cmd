import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createCreateTabCommand(): Command {
  const createTab = new Command('create');
  createTab
    .description('Create a new tab')
    .argument('[url]', 'URL to open (defaults to about:blank)')
    .option('--background', 'Open tab in background (not focused)')
    .action(async (url: string | undefined, options: { background?: boolean }) => {
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
    });

  return createTab;
}
