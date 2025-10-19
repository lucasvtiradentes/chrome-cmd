import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema, type TabsLogsOptions } from '../../../shared/commands/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands/commands-schema.js';
import type { LogEntry } from '../../../shared/types.js';
import { ChromeClient } from '../../lib/chrome-client.js';
import { formatLogEntry } from '../../lib/formatters.js';

export function createGetLogsCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TABS, SubCommandNames.TABS_LOGS, async (options: TabsLogsOptions) => {
    try {
      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());
      let logs = (await client.getTabLogs(tabId)) as LogEntry[];

      const filters: string[] = [];
      if (options.log) filters.push('log');
      if (options.info) filters.push('info');
      if (options.warn) filters.push('warn', 'warning');
      if (options.error) filters.push('error');
      if (options.debug) filters.push('debug', 'verbose');

      if (filters.length > 0) {
        logs = logs.filter((log) => filters.includes(log.type.toLowerCase()));
      }

      const limit = options.n || 50;
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

      displayLogs.forEach((log, index) => {
        console.log(formatLogEntry(log, index));
      });

      console.log('');
    } catch (error) {
      console.error(chalk.red('Error getting logs:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
}
