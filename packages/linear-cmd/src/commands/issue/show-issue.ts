import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';

export function createShowIssueCommand(): Command {
  return new Command('show')
    .arguments('<idOrUrl>')
    .description('Show detailed information about an issue')
    .option('-c, --comments', 'Show comments (default: true)')
    .option('-f, --format <format>', 'Output format (default: pretty)', 'pretty')
    .action(async (idOrUrl: string, options) => {
      try {
        const linearClient = new LinearAPIClient();

        Logger.loading('Fetching issue details...');
        const issueData = await linearClient.getIssueByIdOrUrl(idOrUrl);

        if (options.format === 'json') {
          Logger.json(issueData);
        } else {
          Logger.plain(linearClient.formatIssue(issueData));
        }
      } catch (error) {
        Logger.error('Error fetching issue', error);
        process.exit(1);
      }
    });
}
