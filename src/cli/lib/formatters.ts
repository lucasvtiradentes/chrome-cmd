import chalk from 'chalk';
import { formatTimestamp, formatValue } from '../../shared/helpers.js';
import type { LogEntry, NetworkRequestEntry } from '../../shared/types.js';

export function formatLogEntry(log: LogEntry, index: number): string {
  const lines: string[] = [];

  // Header with index and type
  const typeColors: Record<string, typeof chalk.blue> = {
    log: chalk.blue,
    info: chalk.cyan,
    warn: chalk.yellow,
    warning: chalk.yellow,
    error: chalk.red,
    debug: chalk.gray,
    verbose: chalk.gray
  };

  const typeColor = typeColors[log.type] || chalk.white;
  const timestamp = formatTimestamp(log.timestamp);

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

export function formatRequestEntry(
  req: NetworkRequestEntry,
  index: number,
  showFullBody = false,
  showHeaders = false
): string {
  const lines: string[] = [];

  // Get status color using shared helper (returns color name as string)
  const colorName = getStatusColorName(req.response?.status, req.failed);
  const statusColor = (chalk as any)[colorName] || chalk.gray;

  // Method color
  const methodColor = req.method === 'GET' ? chalk.cyan : req.method === 'POST' ? chalk.yellow : chalk.white;

  // Header line
  const timestamp = formatTimestamp(req.timestamp);
  const status = req.response
    ? `${req.response.status} ${req.response.statusText}`
    : req.failed
      ? `FAILED: ${req.errorText}`
      : 'PENDING';

  lines.push('');
  lines.push(
    chalk.gray(`[${index + 1}]`) +
      ' ' +
      methodColor(`[${req.method}]`) +
      ' ' +
      statusColor(status) +
      ' ' +
      chalk.gray(timestamp)
  );

  // URL
  lines.push(`  ${chalk.white(req.url)}`);

  // Type
  if (req.type) {
    lines.push(`  ${chalk.gray(`Type: ${req.type}`)}`);
  }

  // Size
  if (req.encodedDataLength) {
    const sizeStr = formatBytes(req.encodedDataLength);
    lines.push(`  ${chalk.gray(`Size: ${sizeStr}`)}`);
  }

  // Request headers
  if (showHeaders && req.headers) {
    lines.push(`  ${chalk.gray('Request Headers:')}`);
    Object.entries(req.headers).forEach(([key, value]) => {
      lines.push(`    ${chalk.cyan(key)}: ${chalk.white(value)}`);
    });
  }

  // Response body (if included)
  if (req.responseBody) {
    lines.push(`  ${chalk.gray('Response:')}`);

    // Try to parse as JSON for pretty printing
    try {
      const json = JSON.parse(req.responseBody);
      const jsonStr = JSON.stringify(json, null, 2);

      if (showFullBody) {
        // Show full response
        lines.push(`    ${chalk.white(jsonStr)}`);
      } else {
        // Show preview
        const preview = jsonStr.split('\n').slice(0, 10).join('\n');
        const truncated = jsonStr.split('\n').length > 10;

        lines.push(`    ${chalk.white(preview)}`);
        if (truncated) {
          lines.push(`    ${chalk.gray('... (truncated, use --body to see full response)')}`);
        }
      }
    } catch {
      // Not JSON, show as text
      if (showFullBody) {
        // Show full response
        lines.push(`    ${chalk.white(req.responseBody)}`);
      } else {
        // Show preview
        const preview = req.responseBody.substring(0, 500);
        const truncated = req.responseBody.length > 500;

        lines.push(`    ${chalk.white(preview)}`);
        if (truncated) {
          lines.push(`    ${chalk.gray('... (truncated)')}`);
        }
      }
    }
  }

  return lines.join('\n');
}

function getStatusColorName(status?: number, failed?: boolean): string {
  if (failed) return 'red';
  if (!status) return 'gray';
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'blue';
  if (status >= 400 && status < 500) return 'yellow';
  if (status >= 500) return 'red';
  return 'gray';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
