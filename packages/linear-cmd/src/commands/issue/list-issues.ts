import chalk from 'chalk';
import { Command } from 'commander';
import { ConfigManager } from '../../lib/config-manager.js';
import { getLinearClientForAccount, handleValidationError, ValidationError } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';
import type { LinearIssueFilter } from '../../types/linear.js';
import { linearIssueFilterSchema } from '../../types/linear.js';

export function createListIssuesCommand(): Command {
  return new Command('list')
    .description('List all issues grouped by status')
    .requiredOption('-a, --account <account>', 'specify account to use')
    .option('--assignee <assignee>', 'filter by assignee (email or "me")')
    .option('--state <state>', 'filter by state (case-insensitive)')
    .option('--label <label>', 'filter by label name')
    .option('--project <project>', 'filter by project name')
    .option('--team <team>', 'filter by team key (e.g., "TES")')
    .action(async (options) => {
      const configManager = new ConfigManager();

      try {
        const { client, account } = await getLinearClientForAccount(configManager, options.account);

        // Build filter
        const filter: Partial<LinearIssueFilter> = {};

        // Handle assignee filter
        if (options.assignee) {
          if (options.assignee.toLowerCase() === 'me') {
            const viewer = await client.viewer;
            filter.assignee = { id: { eq: viewer.id } };
          } else {
            const users = await client.users({ filter: { email: { eq: options.assignee } } });
            if (users.nodes.length > 0) {
              filter.assignee = { id: { eq: users.nodes[0].id } };
            } else {
              Logger.error(`User '${options.assignee}' not found`);
              return;
            }
          }
        }

        // Handle state filter
        if (options.state) {
          // Get all states and find case-insensitive match
          const allStates = await client.workflowStates();
          const matchedState = allStates.nodes.find((s) => s.name.toLowerCase() === options.state.toLowerCase());

          if (matchedState) {
            filter.state = { id: { eq: matchedState.id } };
          } else {
            Logger.error(`State '${options.state}' not found`);
            Logger.dim('\nAvailable states:');
            allStates.nodes.forEach((s) => Logger.dim(`  - ${s.name}`));
            return;
          }
        }

        // Handle label filter
        if (options.label) {
          const labels = await client.issueLabels({ filter: { name: { eq: options.label } } });
          if (labels.nodes.length > 0) {
            filter.labels = { some: { id: { eq: labels.nodes[0].id } } };
          } else {
            Logger.error(`Label '${options.label}' not found`);
            return;
          }
        }

        // Handle project filter
        if (options.project) {
          const projects = await client.projects({ filter: { name: { eq: options.project } } });
          if (projects.nodes.length > 0) {
            filter.project = { id: { eq: projects.nodes[0].id } };
          } else {
            Logger.error(`Project '${options.project}' not found`);
            return;
          }
        }

        // Handle team filter
        if (options.team) {
          const teams = await client.teams({ filter: { key: { eq: options.team.toUpperCase() } } });
          if (teams.nodes.length > 0) {
            filter.team = { id: { eq: teams.nodes[0].id } };
          } else {
            Logger.error(`Team '${options.team}' not found`);
            Logger.dim('\nAvailable teams:');
            const allTeams = await client.teams();
            allTeams.nodes.forEach((t) => Logger.dim(`  - ${t.key}: ${t.name}`));
            return;
          }
        }

        // Fetch issues
        Logger.loading(`Fetching issues from account: ${account.name}...`);

        // Fetch all pages
        const allIssues: any[] = [];
        let hasNextPage = true;
        let cursor: string | undefined;

        // Use viewer.assignedIssues() when filtering by "me", otherwise use client.issues()
        const useViewerEndpoint = options.assignee?.toLowerCase() === 'me' && Object.keys(filter).length === 1;

        if (useViewerEndpoint) {
          // Use raw GraphQL to fetch all data in one request per page
          while (hasNextPage) {
            const result: any = await client.client.rawRequest(
              `
              query AssignedIssues($first: Int!, $after: String) {
                viewer {
                  assignedIssues(first: $first, after: $after, includeArchived: true) {
                    nodes {
                      id
                      identifier
                      title
                      description
                      url
                      createdAt
                      updatedAt
                      comments {
                        nodes {
                          id
                        }
                      }
                      state {
                        name
                        color
                      }
                      assignee {
                        name
                        email
                      }
                      project {
                        name
                      }
                      labels {
                        nodes {
                          name
                          color
                        }
                      }
                      attachments {
                        nodes {
                          id
                          url
                          title
                          sourceType
                        }
                      }
                      children {
                        nodes {
                          identifier
                        }
                      }
                    }
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                  }
                }
              }
            `,
              { first: 50, after: cursor }
            );
            allIssues.push(...result.data.viewer.assignedIssues.nodes);
            hasNextPage = result.data.viewer.assignedIssues.pageInfo.hasNextPage;
            cursor = result.data.viewer.assignedIssues.pageInfo.endCursor;
          }
        } else {
          // Use raw GraphQL for regular issues endpoint too
          const validFilter =
            Object.keys(filter).length > 0 ? linearIssueFilterSchema.partial().parse(filter) : undefined;

          while (hasNextPage) {
            const result: any = await client.client.rawRequest(
              `
              query Issues($first: Int!, $after: String, $filter: IssueFilter) {
                issues(first: $first, after: $after, filter: $filter, includeArchived: true) {
                  nodes {
                    id
                    identifier
                    title
                    description
                    url
                    createdAt
                    updatedAt
                    comments {
                      nodes {
                        id
                      }
                    }
                    state {
                      name
                      color
                    }
                    assignee {
                      name
                      email
                    }
                    project {
                      name
                    }
                    labels {
                      nodes {
                        name
                        color
                      }
                    }
                    attachments {
                      nodes {
                        id
                        url
                        title
                        sourceType
                      }
                    }
                    children {
                      nodes {
                        identifier
                      }
                    }
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            `,
              { first: 50, after: cursor, filter: validFilter }
            );
            allIssues.push(...result.data.issues.nodes);
            hasNextPage = result.data.issues.pageInfo.hasNextPage;
            cursor = result.data.issues.pageInfo.endCursor;
          }
        }

        if (allIssues.length === 0) {
          Logger.warning('No issues found');
          return;
        }

        // Group issues by state
        const issuesByState: Record<string, any[]> = {};
        for (const issue of allIssues) {
          const stateName = issue.state?.name || 'Unknown';
          if (!issuesByState[stateName]) {
            issuesByState[stateName] = [];
          }
          issuesByState[stateName].push(issue);
        }

        // Display grouped issues
        Logger.bold(`\nFound ${allIssues.length} issue${allIssues.length === 1 ? '' : 's'}:\n`);

        for (const [stateName, issues] of Object.entries(issuesByState)) {
          const firstIssue = issues[0];
          const stateColor = firstIssue.state?.color || '#999999';
          const stateEmoji = getStateEmoji(stateName);

          Logger.plain('');
          Logger.bold(chalk.hex(stateColor)(`${stateEmoji} ${stateName} (${issues.length})`));
          Logger.plain('');

          for (const issue of issues) {
            Logger.plain(chalk.hex(stateColor)(`  ${issue.identifier}`) + chalk.white(` ${issue.title}`));

            const metadata = [];
            if (issue.assignee) metadata.push(`👤 ${issue.assignee.name}`);
            if (issue.project?.name) metadata.push(`📁 ${issue.project.name}`);
            if (issue.labels?.nodes?.length > 0) {
              metadata.push(`🏷️  ${issue.labels.nodes.map((l: any) => l.name).join(', ')}`);
            }

            // Add description line count if available
            if (issue.description) {
              const lineCount = issue.description.split('\n').length;
              metadata.push(`📄 has description (${lineCount} line${lineCount === 1 ? '' : 's'})`);
            }

            // Add comment count if available
            const commentCount = issue.comments?.nodes?.length || 0;
            if (commentCount > 0) {
              metadata.push(`💬 ${commentCount} comment${commentCount === 1 ? '' : 's'}`);
            }

            // Add sub-issues count if available
            const subIssuesCount = issue.children?.nodes?.length || 0;
            if (subIssuesCount > 0) {
              metadata.push(`🔗 ${subIssuesCount} sub-issue${subIssuesCount === 1 ? '' : 's'}`);
            }

            if (metadata.length > 0) {
              Logger.dim(`    ${metadata.join(' • ')}`);
            }

            // Show PR links if available
            const prAttachments =
              issue.attachments?.nodes?.filter(
                (a: any) =>
                  a.sourceType?.toLowerCase().includes('pull') ||
                  a.sourceType?.toLowerCase().includes('pr') ||
                  (a.url?.includes('github.com') && a.url?.includes('/pull/'))
              ) || [];

            if (prAttachments.length > 0) {
              for (const pr of prAttachments) {
                Logger.dim(`    🔀 PR: ${pr.title} - ${pr.url}`);
              }
            }

            Logger.dim(`    issue link: ${issue.url}`);
            Logger.plain('');
          }
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          handleValidationError(error);
        } else {
          Logger.error('Error listing issues', error);
        }
      }
    });
}

function getStateEmoji(stateName?: string): string {
  if (!stateName) return '❓';

  const name = stateName.toLowerCase();
  if (name.includes('done') || name.includes('complete') || name.includes('closed')) return '✅';
  if (name.includes('progress') || name.includes('review')) return '🔄';
  if (name.includes('blocked')) return '🚫';
  if (name.includes('todo') || name.includes('backlog')) return '📋';
  if (name.includes('canceled') || name.includes('cancelled')) return '❌';
  return '📝';
}
