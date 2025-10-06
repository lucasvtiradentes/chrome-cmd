import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

interface LogEntry {
  type: string;
  timestamp: number;
  args: any[];
  stackTrace?: {
    callFrames: Array<{
      functionName: string;
      url: string;
      lineNumber: number;
      columnNumber: number;
    }>;
  };
  source?: string;
  url?: string;
  lineNumber?: number;
  message?: string;
}

function formatLogEntry(log: LogEntry, index: number): string {
  const lines: string[] = [];

  // Header with index and type
  const typeColors: Record<string, any> = {
    log: chalk.blue,
    info: chalk.cyan,
    warn: chalk.yellow,
    error: chalk.red,
    debug: chalk.gray,
    verbose: chalk.gray
  };

  const typeColor = typeColors[log.type] || chalk.white;
  const timestamp = new Date(log.timestamp).toLocaleTimeString();

  lines.push('');
  lines.push(
    chalk.gray(`[${index + 1}]`) + ' ' + typeColor(`[${log.type.toUpperCase()}]`) + ' ' + chalk.gray(timestamp)
  );

  // Message/Args
  if (log.message) {
    lines.push('  ' + log.message);
  } else if (log.args && log.args.length > 0) {
    const argsStr = log.args
      .map((arg) => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2)
            .split('\n')
            .map((line) => '  ' + line)
            .join('\n');
        }
        return String(arg);
      })
      .join(' ');
    lines.push('  ' + argsStr);
  }

  // Stack trace (only first frame, if available)
  if (log.stackTrace?.callFrames?.[0]) {
    const frame = log.stackTrace.callFrames[0];
    if (frame.url && frame.url !== '') {
      const location = `${frame.url}:${frame.lineNumber}:${frame.columnNumber}`;
      lines.push(chalk.gray('  at ' + (frame.functionName || '<anonymous>') + ' (' + location + ')'));
    }
  } else if (log.url) {
    lines.push(chalk.gray(`  ${log.source || 'source'}: ${log.url}:${log.lineNumber || 0}`));
  }

  return lines.join('\n');
}

export function createGetLogsCommand(): Command {
  const getLogs = new Command('logs');
  getLogs
    .description('Get console logs from a specific tab')
    .argument('<indexOrId>', 'Tab index (1-9) or tab ID')
    .option('-n, --number <count>', 'Show only last N logs', '50')
    .action(async (indexOrId: string, options: { number?: string }) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTab(indexOrId);
        const logs = (await client.getTabLogs(tabId)) as LogEntry[];

        // Get last N logs
        const limit = parseInt(options.number || '50', 10);
        const displayLogs = logs.slice(-limit);

        console.log(chalk.green(`✓ Retrieved ${logs.length} console log(s)`));

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
    });

  return getLogs;
}
