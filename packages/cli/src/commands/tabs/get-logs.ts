import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createGetLogsCommand(): Command {
  const getLogs = new Command('logs');
  getLogs
    .description('Get console logs from a specific tab')
    .argument('<indexOrId>', 'Tab index (1-9) or tab ID')
    .action(async (indexOrId: string) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTab(indexOrId);
        const logs = await client.getTabLogs(tabId);

        console.log(chalk.green('✓ Console logs retrieved successfully'));
        console.log(chalk.bold('\nLogs:'));
        console.log(JSON.stringify(logs, null, 2));
      } catch (error) {
        console.error(chalk.red('Error getting logs:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return getLogs;
}
