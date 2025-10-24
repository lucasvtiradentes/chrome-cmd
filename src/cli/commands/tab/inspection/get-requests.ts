import { Command } from 'commander';
import type { TabsRequestsOptions } from '../../../../protocol/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../protocol/commands/utils.js';
import { colors } from '../../../../shared/utils/helpers/colors.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import type { NetworkRequestEntry } from '../../../../shared/utils/types.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import { formatBytes, formatTimestamp } from '../../../utils/cli-utils.js';

type RequestEntry = NetworkRequestEntry;

export function createGetRequestsCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_REQUESTS,
    async (options: TabsRequestsOptions) => {
      const commandPromise = async () => {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        let requests = (await client.getTabRequests(tabId, options.body)) as RequestEntry[];

        if (options.method) {
          requests = requests.filter((r) => r.method.toUpperCase() === options.method?.toUpperCase());
        }

        if (options.status) {
          requests = requests.filter((r) => r.response?.status === options.status);
        }

        if (options.url) {
          const urlPattern = options.url;
          requests = requests.filter((r) => r.url?.includes(urlPattern));
        }

        if (options.failed) {
          requests = requests.filter((r) => r.failed === true);
        }

        if (!options.all) {
          requests = requests.filter((r) => r.type === 'XHR' || r.type === 'Fetch');
        }

        const DEFAULT_REQUEST_LIMIT = 50;
        const limit = options.n || DEFAULT_REQUEST_LIMIT;
        const displayRequests = requests.slice(-limit);

        logger.success(`✓ Retrieved ${requests.length} network request(s)`);

        const filters: string[] = [];
        if (options.method) filters.push(`method: ${options.method}`);
        if (options.status) filters.push(`status: ${options.status}`);
        if (options.url) filters.push(`url: ${options.url}`);
        if (options.failed) filters.push('failed only');
        if (!options.all) filters.push('XHR/Fetch only');

        if (filters.length > 0) {
          logger.dim(`  Filtered by: ${filters.join(', ')}`);
        }

        if (requests.length > limit) {
          logger.dim(`  Showing last ${limit} requests (use -n to change)`);
        }

        if (displayRequests.length === 0) {
          logger.warning('\n○ No requests captured yet');
          logger.dim('  Requests are captured from the moment you run this command');
          logger.dim('  Reload the page to see new requests');
          return;
        }

        displayRequests.forEach((req, index) => {
          logger.info(formatRequestEntry(req, index, options.body, options.headers));
        });

        logger.info('');
      };

      await commandPromise().catch(commandErrorHandler('Error getting requests:'));
    }
  );
}

function formatRequestEntry(
  req: NetworkRequestEntry,
  index: number,
  showFullBody = false,
  showHeaders = false
): string {
  const lines: string[] = [];

  const getStatusColor = (status?: number, failed?: boolean) => {
    if (failed) return colors.red;
    if (!status) return colors.gray;
    if (status >= 200 && status < 300) return colors.green;
    if (status >= 300 && status < 400) return colors.blue;
    if (status >= 400 && status < 500) return colors.yellow;
    if (status >= 500) return colors.red;
    return colors.gray;
  };

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
