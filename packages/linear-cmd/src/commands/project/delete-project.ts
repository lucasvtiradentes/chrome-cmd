import { LinearClient } from '@linear/sdk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { ConfigManager } from '../../lib/config-manager.js';
import { findAccountForProject, LinearAPIClient } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';

export function createDeleteProjectCommand(): Command {
  return new Command('delete')
    .description('Delete a Linear project')
    .argument('<idOrUrl>', 'project ID or URL')
    .option('-a, --account <account>', 'specify account to use')
    .option('-y, --yes', 'skip confirmation prompt')
    .action(async (idOrUrl: string, options) => {
      const configManager = new ConfigManager();

      try {
        const linearClient = new LinearAPIClient();

        // Find the account that has access to this project
        let accountName: string;
        let client: LinearClient;

        if (options.account) {
          const account = configManager.getAccount(options.account);
          if (!account) {
            Logger.error(`Account '${options.account}' not found`);
            Logger.dim('Run `linear account list` to see available accounts');
            process.exit(1);
          }
          client = new LinearClient({ apiKey: account.api_key });
          accountName = account.name;
        } else {
          const result = await findAccountForProject(configManager, idOrUrl);
          if (!result) {
            Logger.error('Could not find an account with access to this project');
            Logger.dim('Use --account flag to specify which account to use');
            Logger.dim('Run `linear account list` to see available accounts');
            process.exit(1);
          }
          client = result.client;
          accountName = result.account.name;
        }

        // Get project details
        Logger.loading('Fetching project details...');
        const { projectId: projectIdOrSlug } = linearClient.parseProjectUrl(idOrUrl);

        // Try to get project by ID first, if fails, try by slugId
        let project: Awaited<ReturnType<LinearClient['project']>>;
        try {
          project = await client.project(projectIdOrSlug);
        } catch {
          // If ID lookup fails, try searching by slugId
          const projects = await client.projects({
            filter: { slugId: { eq: projectIdOrSlug } }
          });

          if (projects.nodes.length === 0) {
            throw new Error(`Project not found with ID or slug: ${projectIdOrSlug}`);
          }

          project = projects.nodes[0];
        }

        const projectName = project.name;
        const projectId = project.id;

        // Confirm deletion unless --yes flag is used
        if (!options.yes) {
          const answer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete project "${projectName}"?`,
              default: false
            }
          ]);

          if (!answer.confirm) {
            Logger.info('Project deletion cancelled');
            return;
          }
        }

        // Delete the project
        Logger.loading(`Deleting project from account: ${accountName}...`);

        const deleteResult = await client.deleteProject(projectId);
        const success = deleteResult.success;

        if (success) {
          Logger.success(`Project "${projectName}" deleted successfully!`);
        } else {
          Logger.error('Failed to delete project');
        }
      } catch (error) {
        Logger.error('Error deleting project', error);
        process.exit(1);
      }
    });
}
