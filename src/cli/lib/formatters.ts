import { colors } from '../../shared/utils/helpers/colors.js';
import { formatBytes, formatTimestamp, formatValue } from '../../shared/utils/helpers.js';
import type { LogEntry, NetworkRequestEntry } from '../../shared/utils/types.js';

export function formatLogEntry(log: LogEntry, index: number): string {
  const lines: string[] = [];

  const typeColors: Record<string, (text: string) => string> = {
    log: colors.blue,
    info: colors.cyan,
    warn: colors.yellow,
    warning: colors.yellow,
    error: colors.red,
    debug: colors.gray,
    verbose: colors.gray
  };

  const typeColor = typeColors[log.type] || colors.white;
  const timestamp = formatTimestamp(log.timestamp);

  lines.push('');
  lines.push(`${colors.gray(`[${index + 1}]`)} ${typeColor(`[${log.type.toUpperCase()}]`)} ${colors.gray(timestamp)}`);

  if (log.message) {
    lines.push(`  ${log.message}`);
  } else if (log.args && log.args.length > 0) {
    const formattedArgs = log.args.map((arg) => {
      const formatted = formatValue(arg, '  ');
      if (formatted.includes('\n')) {
        return `\n${formatted}`;
      }
      return formatted;
    });

    if (formattedArgs.some((arg) => arg.startsWith('\n'))) {
      lines.push(`  ${formattedArgs.join('\n  ').trim()}`);
    } else {
      lines.push(`  ${formattedArgs.join(' ')}`);
    }
  }

  if (log.stackTrace?.callFrames?.[0]) {
    const frame = log.stackTrace.callFrames[0];
    if (frame.url && frame.url !== '') {
      const location = `${frame.url}:${frame.lineNumber}:${frame.columnNumber}`;
      lines.push(colors.gray(`  at ${frame.functionName || '<anonymous>'} (${location})`));
    }
  } else if (log.url) {
    lines.push(colors.gray(`  ${log.source || 'source'}: ${log.url}:${log.lineNumber || 0}`));
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

  const statusColor = getStatusColor(req.response?.status, req.failed);
  const methodColor = req.method === 'GET' ? colors.cyan : req.method === 'POST' ? colors.yellow : colors.white;
  const timestamp = formatTimestamp(req.timestamp);
  const status = req.response
    ? `${req.response.status} ${req.response.statusText}`
    : req.failed
      ? `FAILED: ${req.errorText}`
      : 'PENDING';

  lines.push('');
  lines.push(
    colors.gray(`[${index + 1}]`) +
      ' ' +
      methodColor(`[${req.method}]`) +
      ' ' +
      statusColor(status) +
      ' ' +
      colors.gray(timestamp)
  );

  lines.push(`  ${colors.white(req.url)}`);

  if (req.type) {
    lines.push(`  ${colors.gray(`Type: ${req.type}`)}`);
  }

  if (req.encodedDataLength) {
    const sizeStr = formatBytes(req.encodedDataLength);
    lines.push(`  ${colors.gray(`Size: ${sizeStr}`)}`);
  }

  if (showHeaders && req.headers) {
    lines.push(`  ${colors.gray('Request Headers:')}`);
    Object.entries(req.headers).forEach(([key, value]) => {
      lines.push(`    ${colors.cyan(key)}: ${colors.white(value)}`);
    });
  }

  if (req.responseBody) {
    lines.push(`  ${colors.gray('Response:')}`);

    try {
      const json = JSON.parse(req.responseBody);
      const jsonStr = JSON.stringify(json, null, 2);

      if (showFullBody) {
        lines.push(`    ${colors.white(jsonStr)}`);
      } else {
        const preview = jsonStr.split('\n').slice(0, 10).join('\n');
        const truncated = jsonStr.split('\n').length > 10;

        lines.push(`    ${colors.white(preview)}`);
        if (truncated) {
          lines.push(`    ${colors.gray('... (truncated, use --body to see full response)')}`);
        }
      }
    } catch {
      if (showFullBody) {
        lines.push(`    ${colors.white(req.responseBody)}`);
      } else {
        const preview = req.responseBody.substring(0, 500);
        const truncated = req.responseBody.length > 500;

        lines.push(`    ${colors.white(preview)}`);
        if (truncated) {
          lines.push(`    ${colors.gray('... (truncated)')}`);
        }
      }
    }
  }

  return lines.join('\n');
}

function getStatusColor(status?: number, failed?: boolean): (text: string) => string {
  if (failed) return colors.red;
  if (!status) return colors.gray;
  if (status >= 200 && status < 300) return colors.green;
  if (status >= 300 && status < 400) return colors.blue;
  if (status >= 400 && status < 500) return colors.yellow;
  if (status >= 500) return colors.red;
  return colors.gray;
}
