import { Command } from 'commander';
import type { TabsLogsOptions } from '../../../../protocol/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../protocol/commands/utils.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import type { LogEntry } from '../../../../shared/utils/types.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { formatLogEntry } from '../../../core/formatters/index.js';

export function createGetLogsCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_LOGS, async (options: TabsLogsOptions) => {
    const commandPromise = async () => {
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

      const DEFAULT_LOG_LIMIT = 50;
      const limit = options.n || DEFAULT_LOG_LIMIT;
      const displayLogs = logs.slice(-limit);

      logger.success(`✓ Retrieved ${logs.length} console log(s)`);

      if (filters.length > 0) {
        const filterNames = [];
        if (options.log) filterNames.push('log');
        if (options.info) filterNames.push('info');
        if (options.warn) filterNames.push('warn');
        if (options.error) filterNames.push('error');
        if (options.debug) filterNames.push('debug');
        logger.dim(`  Filtered by: ${filterNames.join(', ')}`);
      }

      if (logs.length > limit) {
        logger.dim(`  Showing last ${limit} logs (use -n to change)`);
      }

      if (displayLogs.length === 0) {
        logger.warning('\n○ No logs captured yet');
        logger.dim('  Logs are captured from the moment you run this command');
        logger.dim('  Interact with the page and run this command again');
        return;
      }

      displayLogs.forEach((log, index) => {
        logger.info(formatLogEntry(log, index));
      });

      logger.info('');
    };

    await commandPromise().catch(commandErrorHandler('Error getting logs:'));
  });
}
