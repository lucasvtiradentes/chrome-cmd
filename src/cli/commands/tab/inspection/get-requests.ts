import chalk from 'chalk';
import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/cli-command.js';
import type { TabsRequestsOptions } from '../../../../shared/commands/commands-schemas.js';
import { DEFAULT_REQUEST_LIMIT } from '../../../../shared/constants/limits.js';
import { createSubCommandFromSchema } from '../../../../shared/utils/command-builder.js';
import type { NetworkRequestEntry } from '../../../../shared/utils/types.js';
import { ChromeClient } from '../../../lib/chrome-client.js';
import { formatRequestEntry } from '../../../lib/formatters.js';

type RequestEntry = NetworkRequestEntry;

export function createGetRequestsCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_REQUESTS,
    async (options: TabsRequestsOptions) => {
      try {
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

        const limit = options.n || DEFAULT_REQUEST_LIMIT;
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
}
