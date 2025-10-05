import chalk from 'chalk';
import { Command } from 'commander';
import { ConfigManager } from '../../lib/config-manager.js';
import { getLinearClientForAccount, handleValidationError, ValidationError } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';

export function createListProjectsCommand(): Command {
  return new Command('list')
    .description('List all projects')
    .requiredOption('-a, --account <account>', 'specify account to use')
    .option('--team <team>', 'filter by team key (e.g., "TES")')
    .option('-f, --format <format>', 'output format (pretty, json)', 'pretty')
    .option('--limit <limit>', 'maximum number of projects to return', '50')
    .action(async (options) => {
      const configManager = new ConfigManager();

      try {
        const { client, account } = await getLinearClientForAccount(configManager, options.account);

        // Build filter
        const filter: any = {};

        // Handle team filter
        if (options.team) {
          const teams = await client.teams({ filter: { key: { eq: options.team.toUpperCase() } } });
          if (teams.nodes.length > 0) {
            filter.accessibleTeams = { some: { id: { eq: teams.nodes[0].id } } };
          } else {
            Logger.error(`Team '${options.team}' not found`);
            Logger.dim('\nAvailable teams:');
            const allTeams = await client.teams();
            allTeams.nodes.forEach((t) => Logger.dim(`  - ${t.key}: ${t.name}`));
            process.exit(1);
          }
        }

        Logger.loading(`Fetching projects from account: ${account.name}...`);

        const limit = parseInt(options.limit) || 50;
        const projectsConnection = await client.projects({
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          first: limit
        });

        const projects = projectsConnection.nodes;

        if (projects.length === 0) {
          Logger.info('No projects found');
          return;
        }

        if (options.format === 'json') {
          const projectsData = await Promise.all(
            projects.map(async (project) => ({
              id: project.id,
              name: project.name,
              description: project.description,
              state: project.state,
              url: project.url,
              progress: project.progress,
              startDate: project.startDate,
              targetDate: project.targetDate,
              lead: (await project.lead)?.name,
              teams: await project.teams().then((teams) => teams.nodes.map((t) => ({ key: t.key, name: t.name })))
            }))
          );
          Logger.json(projectsData);
        } else {
          // Pretty format
          console.log();
          Logger.success(`Found ${projects.length} project${projects.length === 1 ? '' : 's'}:\n`);

          // Fetch all leads and teams in parallel for better performance
          const projectsData = await Promise.all(
            projects.map(async (project) => ({
              project,
              lead: await project.lead,
              teams: await project.teams()
            }))
          );

          for (const { project, lead, teams } of projectsData) {
            console.log(chalk.bold.cyan(`📁 ${project.name}`));
            console.log(chalk.dim(`   ${project.url}`));

            if (project.description) {
              console.log(`   ${chalk.gray(project.description)}`);
            }

            const details = [];
            if (project.state) {
              details.push(`State: ${project.state}`);
            }
            if (project.progress !== undefined) {
              details.push(`Progress: ${Math.round(project.progress * 100)}%`);
            }
            if (lead) {
              details.push(`Lead: ${lead.name}`);
            }
            if (teams.nodes.length > 0) {
              details.push(`Teams: ${teams.nodes.map((t) => t.key).join(', ')}`);
            }

            if (details.length > 0) {
              console.log(`   ${chalk.dim(details.join(' • '))}`);
            }

            console.log();
          }

          if (projects.length >= limit) {
            Logger.dim(`(Showing first ${limit} projects. Use --limit to show more)`);
          }
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          handleValidationError(error);
        } else {
          Logger.error('Error listing projects', error);
        }
        process.exit(1);
      }
    });
}
