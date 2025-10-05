import { Command } from 'commander';
import inquirer from 'inquirer';
import { ConfigManager } from '../../lib/config-manager.js';
import { getLinearClientForAccount, handleValidationError, ValidationError } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';
import type { LinearIssuePayload } from '../../types/linear.js';
import { linearIssuePayloadSchema } from '../../types/linear.js';

export function createCreateIssueCommand(): Command {
  return new Command('create')
    .description('Create a new Linear issue')
    .requiredOption('-a, --account <account>', 'specify account to use')
    .option('-t, --title <title>', 'issue title')
    .option('-d, --description <description>', 'issue description')
    .option('-p, --priority <priority>', 'priority (0: none, 1: urgent, 2: high, 3: medium, 4: low)')
    .option('-l, --label <label>', 'label name')
    .option('--team <team>', 'team key (e.g., "TES")')
    .option('--project <project>', 'project identifier')
    .option('--assignee <assignee>', 'assignee email or identifier')
    .action(async (options) => {
      const configManager = new ConfigManager();

      try {
        const { client, account } = await getLinearClientForAccount(configManager, options.account);

        // Get teams if not specified or convert team key to ID
        let teamId: string;
        if (options.team) {
          // Convert team key (like "TES") to team ID
          const teams = await client.teams({ filter: { key: { eq: options.team.toUpperCase() } } });
          if (teams.nodes.length > 0) {
            teamId = teams.nodes[0].id;
          } else {
            Logger.error(`Team '${options.team}' not found`);
            Logger.dim('\nAvailable teams:');
            const allTeams = await client.teams();
            allTeams.nodes.forEach((t) => Logger.dim(`  - ${t.key}: ${t.name}`));
            return;
          }
        } else {
          // Interactive team selection
          const teams = await client.teams();
          if (teams.nodes.length === 0) {
            Logger.error('No teams found');
            return;
          }

          if (teams.nodes.length === 1) {
            teamId = teams.nodes[0].id;
          } else {
            const teamAnswer = await inquirer.prompt([
              {
                type: 'list',
                name: 'team',
                message: 'Select team:',
                choices: teams.nodes.map((t) => ({ name: `${t.name} (${t.key})`, value: t.id }))
              }
            ]);
            teamId = teamAnswer.team;
          }
        }

        // Get issue details interactively if not provided
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Issue title:',
            when: !options.title,
            validate: (input) => input.length > 0 || 'Title is required'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Issue description (optional):',
            when: !options.description
          }
        ]);

        const title = options.title || answers.title;
        const description = options.description || answers.description || undefined;

        // Create the issue
        Logger.loading(`Creating issue in account: ${account.name}...`);

        const issuePayload: Partial<LinearIssuePayload> = {
          teamId,
          title,
          description
        };

        // Add priority if specified
        if (options.priority !== undefined) {
          const priority = parseInt(options.priority);
          if (priority >= 0 && priority <= 4) {
            issuePayload.priority = priority;
          }
        }

        // Add assignee if specified
        if (options.assignee) {
          const users = await client.users({ filter: { email: { eq: options.assignee } } });
          if (users.nodes.length > 0) {
            issuePayload.assigneeId = users.nodes[0].id;
          } else {
            Logger.warning(`User '${options.assignee}' not found, creating without assignee`);
          }
        }

        // Add project if specified
        if (options.project) {
          const projects = await client.projects({ filter: { name: { eq: options.project } } });
          if (projects.nodes.length > 0) {
            issuePayload.projectId = projects.nodes[0].id;
          } else {
            Logger.warning(`Project '${options.project}' not found, creating without project`);
          }
        }

        // Add label if specified
        if (options.label) {
          const labels = await client.issueLabels({ filter: { name: { eq: options.label } } });
          if (labels.nodes.length > 0) {
            issuePayload.labelIds = [labels.nodes[0].id];
          } else {
            Logger.warning(`Label '${options.label}' not found, creating without label`);
          }
        }

        // Validate the payload
        const validPayload = linearIssuePayloadSchema.parse(issuePayload);

        const issue = await client.createIssue(validPayload);
        const createdIssue = await issue.issue;

        if (!createdIssue) {
          throw new Error('Failed to create issue');
        }

        Logger.success('Issue created successfully!');
        Logger.info(`📋 ID: ${createdIssue.identifier}`);
        Logger.link(createdIssue.url, 'URL:');

        const assignee = await createdIssue.assignee;
        if (assignee) {
          Logger.dim(`👤 Assigned to: ${assignee.name}`);
        }

        const project = await createdIssue.project;
        if (project) {
          Logger.dim(`📁 Project: ${project.name}`);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          handleValidationError(error);
        } else {
          Logger.error('Error creating issue', error);
        }
      }
    });
}
