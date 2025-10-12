import chalk from 'chalk';
import { Command } from 'commander';
import type { NetworkRequestEntry } from '../../../shared/types.js';
import { ChromeClient } from '../../lib/chrome-client.js';
import { formatRequestEntry } from '../../lib/formatters.js';

type RequestEntry = NetworkRequestEntry;

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

          if (options.method) {
            requests = requests.filter((r) => r.method.toUpperCase() === options.method?.toUpperCase());
          }

          if (options.status) {
            const statusCode = parseInt(options.status, 10);
            requests = requests.filter((r) => r.response?.status === statusCode);
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

          const limit = parseInt(options.number || '50', 10);
          const displayRequests = requests.slice(-limit);

          console.log(chalk.green(`✓ Retrieved ${requests.length} network request(s)`));

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
