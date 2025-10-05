import { LinearClient } from '@linear/sdk';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { ConfigManager } from '../../lib/config-manager.js';
import {
  findAccountForIssue,
  getLinearClientForAccount,
  handleValidationError,
  LinearAPIClient,
  ValidationError
} from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';
import type { LinearIssueUpdatePayload } from '../../types/linear.js';
import { linearIssueUpdatePayloadSchema } from '../../types/linear.js';
import type { Account } from '../../types/local.js';

function getPriorityName(priority: number | null | undefined): string {
  switch (priority) {
    case 1:
      return '🔴 Urgent';
    case 2:
      return '🟠 High';
    case 3:
      return '🟡 Medium';
    case 4:
      return '🔵 Low';
    default:
      return '⚪ None';
  }
}

export function createUpdateIssueCommand(): Command {
  return new Command('update')
    .description('Update a Linear issue')
    .argument('<issue>', 'issue ID or URL')
    .option('-a, --account <account>', 'specify account to use')
    .option('-t, --title <title>', 'new title')
    .option('-d, --description <description>', 'new description')
    .option('-s, --state <state>', 'new state (e.g., "In Progress", "Done")')
    .option('--assignee <assignee>', 'assignee email or "unassign"')
    .option('--project <project>', 'project name or "none" to remove')
    .option('--team <team>', 'team key (e.g., "TES")')
    .option('-p, --priority <priority>', 'priority (0: none, 1: urgent, 2: high, 3: medium, 4: low)')
    .option('--add-label <label>', 'add a label')
    .option('--remove-label <label>', 'remove a label')
    .option('--archive', 'archive the issue')
    .action(async (issueIdOrUrl, options) => {
      const configManager = new ConfigManager();

      try {
        // Parse issue identifier first
        const linearClient = new LinearAPIClient();
        const issueId = linearClient.parseIssueIdentifier(issueIdOrUrl);
        if (!issueId) {
          console.error(chalk.red('❌ Invalid issue ID or URL'));
          return;
        }

        // For update, we'll try to find the account that has access to this issue
        // if not specified
        let account: Account | undefined;
        let client: LinearClient | undefined;

        if (options.account) {
          const result = await getLinearClientForAccount(configManager, options.account);
          client = result.client;
          account = result.account;
        } else {
          const result = await findAccountForIssue(configManager, issueId);
          if (!result) {
            throw new ValidationError('Could not find an account with access to this issue', [
              'Use --account flag to specify which account to use',
              'Run `linear account list` to see available accounts'
            ]);
          }
          client = result.client;
          account = result.account;
        }

        // Fetch the issue
        const issue = await client.issue(issueId);
        if (!issue) {
          console.error(chalk.red(`❌ Issue ${issueId} not found`));
          return;
        }

        // Build update payload
        const updatePayload: Partial<LinearIssueUpdatePayload> = {};
        let hasUpdates = false;

        // Handle title update
        if (options.title !== undefined) {
          updatePayload.title = options.title;
          hasUpdates = true;
        }

        // Handle description update
        if (options.description !== undefined) {
          updatePayload.description = options.description;
          hasUpdates = true;
        }

        // Handle state update
        if (options.state) {
          const team = await issue.team;
          if (!team) {
            console.error(chalk.red('❌ Unable to get issue team'));
            return;
          }

          const states = await client.workflowStates({
            filter: {
              name: { eq: options.state },
              team: { id: { eq: team.id } }
            }
          });

          if (states.nodes.length > 0) {
            updatePayload.stateId = states.nodes[0].id;
            hasUpdates = true;
          } else {
            console.error(chalk.red(`❌ State '${options.state}' not found`));
            return;
          }
        }

        // Handle assignee update
        if (options.assignee) {
          if (options.assignee.toLowerCase() === 'unassign') {
            updatePayload.assigneeId = null;
            hasUpdates = true;
          } else {
            const users = await client.users({ filter: { email: { eq: options.assignee } } });
            if (users.nodes.length > 0) {
              updatePayload.assigneeId = users.nodes[0].id;
              hasUpdates = true;
            } else {
              console.error(chalk.red(`❌ User '${options.assignee}' not found`));
              return;
            }
          }
        }

        // Handle project update
        if (options.project) {
          if (options.project.toLowerCase() === 'none') {
            updatePayload.projectId = null;
            hasUpdates = true;
          } else {
            const projects = await client.projects({ filter: { name: { eq: options.project } } });
            if (projects.nodes.length > 0) {
              updatePayload.projectId = projects.nodes[0].id;
              hasUpdates = true;
            } else {
              console.error(chalk.red(`❌ Project '${options.project}' not found`));
              return;
            }
          }
        }

        // Handle team update
        if (options.team) {
          const teams = await client.teams({ filter: { key: { eq: options.team.toUpperCase() } } });
          if (teams.nodes.length > 0) {
            updatePayload.teamId = teams.nodes[0].id;
            hasUpdates = true;
          } else {
            console.error(chalk.red(`❌ Team '${options.team}' not found`));
            Logger.dim('\nAvailable teams:');
            const allTeams = await client.teams();
            allTeams.nodes.forEach((t) => Logger.dim(`  - ${t.key}: ${t.name}`));
            return;
          }
        }

        // Handle priority update
        if (options.priority !== undefined) {
          const priority = parseInt(options.priority);
          if (priority >= 0 && priority <= 4) {
            updatePayload.priority = priority;
            hasUpdates = true;
          }
        }

        // Handle label additions
        if (options.addLabel) {
          const labels = await client.issueLabels({ filter: { name: { eq: options.addLabel } } });
          if (labels.nodes.length > 0) {
            const currentLabels = await issue.labels();
            const currentLabelIds = currentLabels.nodes.map((l) => l.id);

            if (!currentLabelIds.includes(labels.nodes[0].id)) {
              updatePayload.labelIds = [...currentLabelIds, labels.nodes[0].id];
              hasUpdates = true;
            } else {
              Logger.warning(`Label '${options.addLabel}' already added`);
            }
          } else {
            console.error(chalk.red(`❌ Label '${options.addLabel}' not found`));
            return;
          }
        }

        // Handle label removals
        if (options.removeLabel) {
          const currentLabels = await issue.labels();
          const labelToRemove = currentLabels.nodes.find((l) => l.name === options.removeLabel);

          if (labelToRemove) {
            updatePayload.labelIds = currentLabels.nodes.filter((l) => l.id !== labelToRemove.id).map((l) => l.id);
            hasUpdates = true;
          } else {
            Logger.warning(`Label '${options.removeLabel}' not found on issue`);
          }
        }

        // Handle archive
        if (options.archive) {
          // Archive is a separate action, not part of the update payload
          Logger.loading(`Archiving issue in account: ${account?.name || 'unknown'}...`);
          await client.archiveIssue(issue.id);
          Logger.success(`Issue ${issue.identifier} archived successfully!`);
          return;
        }

        // If no updates specified, show interactive prompt
        if (!hasUpdates) {
          const currentState = await issue.state;
          const currentAssignee = await issue.assignee;
          const issueTeam = await issue.team;

          // Fetch states and users once
          const states = issueTeam
            ? await client.workflowStates({
                filter: { team: { id: { eq: issueTeam.id } } }
              })
            : null;
          const users = await client.users();

          const pendingUpdates: Record<string, any> = {};

          let continueEditing = true;
          while (continueEditing) {
            // Build menu choices showing current vs updated values
            const choices = [
              {
                name: `Title: ${pendingUpdates.title ? `${issue.title} → ${pendingUpdates.title}` : issue.title}`,
                value: 'title'
              },
              {
                name: `Description: ${
                  pendingUpdates.description !== undefined
                    ? `${issue.description || '(empty)'} → ${pendingUpdates.description || '(empty)'}`
                    : issue.description || '(empty)'
                }`,
                value: 'description'
              },
              {
                name: `State: ${
                  pendingUpdates.stateId
                    ? `${currentState?.name} → ${states?.nodes.find((s) => s.id === pendingUpdates.stateId)?.name}`
                    : currentState?.name || 'Unknown'
                }`,
                value: 'state'
              },
              {
                name: `Assignee: ${
                  pendingUpdates.assigneeId !== undefined
                    ? `${currentAssignee?.name || 'Unassigned'} → ${pendingUpdates.assigneeId ? users.nodes.find((u) => u.id === pendingUpdates.assigneeId)?.name : 'Unassigned'}`
                    : currentAssignee?.name || 'Unassigned'
                }`,
                value: 'assignee'
              },
              {
                name: `Priority: ${
                  pendingUpdates.priority !== undefined
                    ? `${getPriorityName(issue.priority)} → ${getPriorityName(pendingUpdates.priority)}`
                    : getPriorityName(issue.priority)
                }`,
                value: 'priority'
              },
              new inquirer.Separator(),
              { name: 'Apply changes', value: 'apply' },
              { name: 'Cancel', value: 'cancel' }
            ];

            const answer = await inquirer.prompt([
              {
                type: 'list',
                name: 'action',
                message: 'What would you like to update?',
                choices: choices
              }
            ]);

            switch (answer.action) {
              case 'title': {
                const titleAnswer = await inquirer.prompt([
                  {
                    type: 'input',
                    name: 'title',
                    message: 'New title:',
                    default: pendingUpdates.title || issue.title
                  }
                ]);
                pendingUpdates.title = titleAnswer.title;
                break;
              }

              case 'description': {
                const descAnswer = await inquirer.prompt([
                  {
                    type: 'input',
                    name: 'description',
                    message: 'New description:',
                    default:
                      pendingUpdates.description !== undefined ? pendingUpdates.description : issue.description || ''
                  }
                ]);
                pendingUpdates.description = descAnswer.description;
                break;
              }

              case 'state': {
                if (!states) {
                  console.error(chalk.red('❌ Unable to get team states'));
                  break;
                }

                const stateAnswer = await inquirer.prompt([
                  {
                    type: 'list',
                    name: 'state',
                    message: 'New state:',
                    choices: states.nodes.map((s) => ({
                      name: s.name,
                      value: s.id
                    })),
                    default: pendingUpdates.stateId || currentState?.id
                  }
                ]);
                pendingUpdates.stateId = stateAnswer.state;
                break;
              }

              case 'assignee': {
                const assigneeChoices = [
                  { name: 'Unassigned', value: null },
                  ...users.nodes.map((u) => ({
                    name: `${u.name} (${u.email})`,
                    value: u.id
                  }))
                ];
                const assigneeAnswer = await inquirer.prompt([
                  {
                    type: 'list',
                    name: 'assignee',
                    message: 'New assignee:',
                    choices: assigneeChoices,
                    default: pendingUpdates.assigneeId !== undefined ? pendingUpdates.assigneeId : currentAssignee?.id
                  }
                ]);
                pendingUpdates.assigneeId = assigneeAnswer.assignee;
                break;
              }

              case 'priority': {
                const priorityAnswer = await inquirer.prompt([
                  {
                    type: 'list',
                    name: 'priority',
                    message: 'New priority:',
                    choices: [
                      { name: '🔴 Urgent', value: 1 },
                      { name: '🟠 High', value: 2 },
                      { name: '🟡 Medium', value: 3 },
                      { name: '🔵 Low', value: 4 },
                      { name: '⚪ None', value: 0 }
                    ],
                    default: pendingUpdates.priority !== undefined ? pendingUpdates.priority : issue.priority || 0
                  }
                ]);
                pendingUpdates.priority = priorityAnswer.priority;
                break;
              }

              case 'apply': {
                Object.assign(updatePayload, pendingUpdates);
                continueEditing = false;
                break;
              }

              case 'cancel': {
                console.log(chalk.dim('Update cancelled'));
                return;
              }
            }
          }
        }

        // Validate and update the issue
        const validPayload = linearIssueUpdatePayloadSchema.parse(updatePayload);

        Logger.loading(`Updating issue in account: ${account?.name || 'unknown'}...`);
        await client.updateIssue(issue.id, validPayload);

        Logger.success(`Issue ${issue.identifier} updated successfully!`);
        Logger.link(issue.url);
      } catch (error) {
        if (error instanceof ValidationError) {
          handleValidationError(error);
        } else {
          Logger.error('Error updating issue', error);
        }
      }
    });
}
