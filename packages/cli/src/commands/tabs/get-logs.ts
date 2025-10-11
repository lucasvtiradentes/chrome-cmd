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

function formatValue(value: any, indent = '  '): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;

  if (type === 'string') return value;
  if (type === 'number' || type === 'boolean') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 3 && value.every((v) => typeof v !== 'object' || v === null)) {
      return `[${value.map((v) => formatValue(v, '')).join(', ')}]`;
    }
    return JSON.stringify(value, null, 2)
      .split('\n')
      .map((line) => indent + line)
      .join('\n')
      .trim();
  }

  if (type === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    if (keys.length <= 3) {
      const pairs = keys.map((k) => `${k}: ${formatValue(value[k], '')}`);
      return `{ ${pairs.join(', ')} }`;
    }
    return JSON.stringify(value, null, 2)
      .split('\n')
      .map((line) => indent + line)
      .join('\n')
      .trim();
  }

  return String(value);
}

function formatLogEntry(log: LogEntry, index: number): string {
  const lines: string[] = [];

  // Header with index and type
  const typeColors: Record<string, any> = {
    log: chalk.blue,
    info: chalk.cyan,
    warn: chalk.yellow,
    warning: chalk.yellow,
    error: chalk.red,
    debug: chalk.gray,
    verbose: chalk.gray
  };

  const typeColor = typeColors[log.type] || chalk.white;
  const timestamp = new Date(log.timestamp).toLocaleTimeString();

  lines.push('');
  lines.push(`${chalk.gray(`[${index + 1}]`)} ${typeColor(`[${log.type.toUpperCase()}]`)} ${chalk.gray(timestamp)}`);

  // Message/Args
  if (log.message) {
    lines.push(`  ${log.message}`);
  } else if (log.args && log.args.length > 0) {
    // Format each argument on its own line if it's complex, otherwise join with space
    const formattedArgs = log.args.map((arg) => {
      const formatted = formatValue(arg, '  ');
      // Check if it's a multi-line formatted value (object/array)
      if (formatted.includes('\n')) {
        return `\n${formatted}`;
      }
      return formatted;
    });

    // If any arg is multi-line, put each on new line
    if (formattedArgs.some((arg) => arg.startsWith('\n'))) {
      lines.push(`  ${formattedArgs.join('\n  ').trim()}`);
    } else {
      lines.push(`  ${formattedArgs.join(' ')}`);
    }
  }

  // Stack trace (only first frame, if available)
  if (log.stackTrace?.callFrames?.[0]) {
    const frame = log.stackTrace.callFrames[0];
    if (frame.url && frame.url !== '') {
      const location = `${frame.url}:${frame.lineNumber}:${frame.columnNumber}`;
      lines.push(chalk.gray(`  at ${frame.functionName || '<anonymous>'} (${location})`));
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
