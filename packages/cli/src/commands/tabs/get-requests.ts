import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

interface RequestEntry {
  requestId: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: number;
  type: string;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    mimeType: string;
  };
  finished?: boolean;
  failed?: boolean;
  errorText?: string;
  encodedDataLength?: number;
  responseBody?: string;
  responseBodyBase64?: boolean;
}

function formatRequestEntry(
  req: RequestEntry,
  index: number,
  showFullBody: boolean = false,
  showHeaders: boolean = false
): string {
  const lines: string[] = [];

  // Status color
  let statusColor = chalk.gray;
  if (req.response) {
    const status = req.response.status;
    if (status >= 200 && status < 300) statusColor = chalk.green;
    else if (status >= 300 && status < 400) statusColor = chalk.blue;
    else if (status >= 400 && status < 500) statusColor = chalk.yellow;
    else if (status >= 500) statusColor = chalk.red;
  } else if (req.failed) {
    statusColor = chalk.red;
  }

  // Method color
  const methodColor = req.method === 'GET' ? chalk.cyan : req.method === 'POST' ? chalk.yellow : chalk.white;

  // Header line
  const timestamp = new Date(req.timestamp).toLocaleTimeString();
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
  lines.push('  ' + chalk.white(req.url));

  // Type
  if (req.type) {
    lines.push('  ' + chalk.gray(`Type: ${req.type}`));
  }

  // Size
  if (req.encodedDataLength) {
    const size =
      req.encodedDataLength > 1024 ? `${(req.encodedDataLength / 1024).toFixed(2)} KB` : `${req.encodedDataLength} B`;
    lines.push('  ' + chalk.gray(`Size: ${size}`));
  }

  // Request headers
  if (showHeaders && req.headers) {
    lines.push('  ' + chalk.gray('Request Headers:'));
    Object.entries(req.headers).forEach(([key, value]) => {
      lines.push('    ' + chalk.cyan(key) + ': ' + chalk.white(value));
    });
  }

  // Response body (if included)
  if (req.responseBody) {
    lines.push('  ' + chalk.gray('Response:'));

    // Try to parse as JSON for pretty printing
    try {
      const json = JSON.parse(req.responseBody);
      const jsonStr = JSON.stringify(json, null, 2);

      if (showFullBody) {
        // Show full response
        lines.push('    ' + chalk.white(jsonStr));
      } else {
        // Show preview
        const preview = jsonStr.split('\n').slice(0, 10).join('\n');
        const truncated = jsonStr.split('\n').length > 10;

        lines.push('    ' + chalk.white(preview));
        if (truncated) {
          lines.push('    ' + chalk.gray('... (truncated, use --body to see full response)'));
        }
      }
    } catch {
      // Not JSON, show as text
      if (showFullBody) {
        // Show full response
        lines.push('    ' + chalk.white(req.responseBody));
      } else {
        // Show preview
        const preview = req.responseBody.substring(0, 500);
        const truncated = req.responseBody.length > 500;

        lines.push('    ' + chalk.white(preview));
        if (truncated) {
          lines.push('    ' + chalk.gray('... (truncated)'));
        }
      }
    }
  }

  return lines.join('\n');
}

export function createGetRequestsCommand(): Command {
  const getRequests = new Command('requests');
  getRequests
    .description('Get network requests from a specific tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .option('-n, --number <count>', 'Show only last N requests', '50')
    .option('--method <method>', 'Filter by HTTP method (GET, POST, etc.)')
    .option('--status <code>', 'Filter by status code (200, 404, etc.)')
    .option('--url <pattern>', 'Filter by URL pattern (e.g., "/proxy", "google.com")')
    .option('--failed', 'Show only failed requests')
    .option('--all', 'Show all request types (by default only XHR/Fetch are shown)')
    .option('--body', 'Include response bodies')
    .option('--headers', 'Include request and response headers')
    .action(
      async (options: {
        tab?: string;
        number?: string;
        method?: string;
        status?: string;
        url?: string;
        failed?: boolean;
        all?: boolean;
        body?: boolean;
        headers?: boolean;
      }) => {
        try {
          const client = new ChromeClient();
          const tabId = await client.resolveTabWithConfig(options.tab);
          let requests = (await client.getTabRequests(tabId, options.body)) as RequestEntry[];

          // Filter by method
          if (options.method) {
            requests = requests.filter((r) => r.method.toUpperCase() === options.method!.toUpperCase());
          }

          // Filter by status
          if (options.status) {
            const statusCode = parseInt(options.status, 10);
            requests = requests.filter((r) => r.response?.status === statusCode);
          }

          // Filter by URL pattern
          if (options.url) {
            requests = requests.filter((r) => r.url && r.url.includes(options.url!));
          }

          // Filter failed
          if (options.failed) {
            requests = requests.filter((r) => r.failed === true);
          }

          // Filter XHR/Fetch by default (unless --all is specified)
          if (!options.all) {
            requests = requests.filter((r) => r.type === 'XHR' || r.type === 'Fetch');
          }

          // Get last N requests
          const limit = parseInt(options.number || '50', 10);
          const displayRequests = requests.slice(-limit);

          console.log(chalk.green(`✓ Retrieved ${requests.length} network request(s)`));

          // Show filters
          const filters: string[] = [];
          if (options.method) filters.push(`method: ${options.method}`);
          if (options.status) filters.push(`status: ${options.status}`);
          if (options.url) filters.push(`url: ${options.url}`);
          if (options.failed) filters.push('failed only');
          if (!options.all) filters.push('XHR/Fetch only');

          if (filters.length > 0) {
            console.log(chalk.gray(`  Filtered by: ${filters.join(', ')}`));
          }

          if (requests.length > limit) {
            console.log(chalk.gray(`  Showing last ${limit} requests (use -n to change)`));
          }

          if (displayRequests.length === 0) {
            console.log(chalk.yellow('\n○ No requests captured yet'));
            console.log(chalk.gray('  Requests are captured from the moment you run this command'));
            console.log(chalk.gray('  Reload the page to see new requests'));
            return;
          }

          // Display formatted requests
          displayRequests.forEach((req, index) => {
            console.log(formatRequestEntry(req, index, options.body, options.headers));
          });

          console.log('');
        } catch (error) {
          console.error(chalk.red('Error getting requests:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      }
    );

  return getRequests;
}
