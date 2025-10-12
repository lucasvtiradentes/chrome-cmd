import chalk from 'chalk';
import { Command } from 'commander';
import type { LogEntry } from '../../../shared/types.js';
import { ChromeClient } from '../../lib/chrome-client.js';
import { formatLogEntry } from '../../lib/formatters.js';

export function createGetLogsCommand(): Command {
  const getLogs = new Command('logs');
  getLogs
    .description('Get console logs from a specific tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .option('-n, --number <count>', 'Show only last N logs', '50')
    .option('--log', 'Show only log messages')
    .option('--info', 'Show only info messages')
    .option('--warn', 'Show only warning messages')
    .option('--error', 'Show only error messages')
    .option('--debug', 'Show only debug messages')
    .action(
      async (options: {
        tab?: string;
        number?: string;
        log?: boolean;
        info?: boolean;
        warn?: boolean;
        error?: boolean;
        debug?: boolean;
      }) => {
        try {
          const client = new ChromeClient();
          const tabId = await client.resolveTabWithConfig(options.tab);
          let logs = (await client.getTabLogs(tabId)) as LogEntry[];

          // Filter by type if any filter is specified
          const filters: string[] = [];
          if (options.log) filters.push('log');
          if (options.info) filters.push('info');
          if (options.warn) filters.push('warn', 'warning');
          if (options.error) filters.push('error');
          if (options.debug) filters.push('debug', 'verbose');

          if (filters.length > 0) {
            logs = logs.filter((log) => filters.includes(log.type.toLowerCase()));
          }

          // Get last N logs
          const limit = parseInt(options.number || '50', 10);
          const displayLogs = logs.slice(-limit);

          console.log(chalk.green(`✓ Retrieved ${logs.length} console log(s)`));

          if (filters.length > 0) {
            const filterNames = [];
            if (options.log) filterNames.push('log');
            if (options.info) filterNames.push('info');
            if (options.warn) filterNames.push('warn');
            if (options.error) filterNames.push('error');
            if (options.debug) filterNames.push('debug');
            console.log(chalk.gray(`  Filtered by: ${filterNames.join(', ')}`));
          }

          if (logs.length > limit) {
            console.log(chalk.gray(`  Showing last ${limit} logs (use -n to change)`));
          }

          if (displayLogs.length === 0) {
            console.log(chalk.yellow('\n○ No logs captured yet'));
            console.log(chalk.gray('  Logs are captured from the moment you run this command'));
            console.log(chalk.gray('  Interact with the page and run this command again'));
            return;
          }

          // Display formatted logs
          displayLogs.forEach((log, index) => {
            console.log(formatLogEntry(log, index));
          });

          console.log('');
        } catch (error) {
          console.error(chalk.red('Error getting logs:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      }
    );

  return getLogs;
}
