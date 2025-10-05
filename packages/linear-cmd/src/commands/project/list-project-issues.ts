import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';

export function createListProjectIssuesCommand(): Command {
  return new Command('issues')
    .arguments('<idOrUrl>')
    .description('List all issues in a project grouped by status')
    .option('-f, --format <format>', 'Output format (default: pretty)', 'pretty')
    .action(async (idOrUrl: string, options) => {
      try {
        const linearClient = new LinearAPIClient();

        Logger.loading('Fetching project issues...');
        const issues = await linearClient.getProjectIssues(idOrUrl);

        if (options.format === 'json') {
          Logger.json(issues);
        } else {
          Logger.plain(linearClient.formatProjectIssues(issues));
        }
      } catch (error) {
        Logger.error('Error fetching project issues', error);
        process.exit(1);
      }
    });
}
