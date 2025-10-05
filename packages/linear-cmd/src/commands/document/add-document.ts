import { Command } from 'commander';
import inquirer from 'inquirer';
import { ConfigManager } from '../../lib/config-manager.js';
import { getLinearClientForAccount, LinearAPIClient } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';

export function createAddDocumentCommand(): Command {
  return new Command('add')
    .description('Create a new Linear document')
    .requiredOption('-a, --account <account>', 'specify account to use')
    .option('-t, --title <title>', 'document title')
    .option('-c, --content <content>', 'document content (markdown)')
    .option('-p, --project <project>', 'project ID or URL to link the document to')
    .action(async (options) => {
      const configManager = new ConfigManager();

      try {
        const { client, account } = await getLinearClientForAccount(configManager, options.account);
        const linearClient = new LinearAPIClient();

        // Get project ID if specified
        let projectId: string | undefined;
        if (options.project) {
          const { projectId: projectIdOrSlug } = linearClient.parseProjectUrl(options.project);

          // Verify the project exists - try by ID first, then by slugId
          try {
            const project = await client.project(projectIdOrSlug);
            projectId = project.id;
          } catch {
            // If ID lookup fails, try searching by slugId
            try {
              const projects = await client.projects({
                filter: { slugId: { eq: projectIdOrSlug } }
              });

              if (projects.nodes.length === 0) {
                Logger.error(`Project '${options.project}' not found`);
                process.exit(1);
              }

              projectId = projects.nodes[0].id;
            } catch (error) {
              Logger.error(`Project '${options.project}' not found`, error);
              process.exit(1);
            }
          }
        }

        // Get document details interactively if not provided
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Document title:',
            when: !options.title,
            validate: (input) => input.length > 0 || 'Title is required'
          },
          {
            type: 'editor',
            name: 'content',
            message: 'Document content (markdown, will open editor):',
            when: !options.content
          }
        ]);

        const title = options.title || answers.title;
        const content = options.content || answers.content || undefined;

        // Create the document
        Logger.loading(`Creating document in account: ${account.name}...`);

        const document = await linearClient.createDocument(account.name, title, {
          content,
          projectId
        });

        Logger.success('Document created successfully!');
        Logger.info(`📄 Title: ${document.title}`);
        Logger.link(document.url, 'URL:');

        if (projectId) {
          Logger.dim('📁 Linked to project');
        }
      } catch (error) {
        Logger.error('Error creating document', error);
        process.exit(1);
      }
    });
}
