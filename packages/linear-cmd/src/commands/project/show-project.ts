import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';

export function createShowProjectCommand(): Command {
  return new Command('show')
    .arguments('<idOrUrl>')
    .description('Show detailed information about a project')
    .option('-f, --format <format>', 'Output format (default: pretty)', 'pretty')
    .action(async (idOrUrl: string, options) => {
      try {
        const linearClient = new LinearAPIClient();

        Logger.loading('Fetching project details...');
        const projectData = await linearClient.getProjectByIdOrUrl(idOrUrl);

        if (options.format === 'json') {
          Logger.json(projectData);
        } else {
          Logger.plain(linearClient.formatProject(projectData));
        }
      } catch (error) {
        Logger.error('Error fetching project', error);
        process.exit(1);
      }
    });
}
