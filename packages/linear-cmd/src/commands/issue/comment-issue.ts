import { LinearClient } from '@linear/sdk';
import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigManager } from '../../lib/config-manager.js';
import { findAccountForIssue, LinearAPIClient } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';

export function createCommentIssueCommand(): Command {
  return new Command('comment')
    .description('Add a comment to a Linear issue')
    .argument('<issue>', 'issue ID or URL')
    .argument('[comment]', 'comment text (optional, will prompt if not provided)')
    .option('-a, --account <account>', 'specify account to use')
    .action(async (issueIdOrUrl, commentText, options) => {
      const configManager = new ConfigManager();

      try {
        // Parse issue identifier first
        const linearClient = new LinearAPIClient();
        const issueId = linearClient.parseIssueIdentifier(issueIdOrUrl);
        if (!issueId) {
          Logger.error('Invalid issue ID or URL');
          return;
        }

        // Find the account that has access to this issue
        let client: LinearClient;

        if (options.account) {
          const account = configManager.getAccount(options.account);
          if (!account) {
            Logger.error(`Account '${options.account}' not found`);
            Logger.dim('Run `linear account list` to see available accounts');
            return;
          }
          client = new LinearClient({ apiKey: account.api_key });
        } else {
          const result = await findAccountForIssue(configManager, issueId);
          if (!result) {
            Logger.error('Could not find an account with access to this issue');
            Logger.dim('Use --account flag to specify which account to use');
            Logger.dim('Run `linear account list` to see available accounts');
            return;
          }
          client = result.client;
        }

        // Fetch the issue
        const issue = await client.issue(issueId);
        if (!issue) {
          Logger.error(`Issue ${issueId} not found`);
          return;
        }

        // Get comment text
        let comment = commentText;

        if (!comment) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'comment',
              message: 'Comment:',
              validate: (input: string) => input.trim().length > 0 || 'Comment cannot be empty'
            }
          ]);
          comment = answers.comment;
        }

        // Add the comment
        Logger.loading('Adding comment...');

        await client.createComment({
          issueId: issue.id,
          body: comment
        });

        Logger.success(`Comment added to ${issue.identifier}`);
        Logger.link(issue.url);

        // Show recent comments
        const comments = await issue.comments({ last: 3 });
        if (comments.nodes.length > 0) {
          Logger.dim('\nRecent comments:');
          for (const c of comments.nodes.reverse()) {
            const author = await c.user;
            const createdAt = new Date(c.createdAt);
            const timeAgo = getRelativeTime(createdAt);

            Logger.info(`💬 ${author?.name || 'Unknown'} • ${timeAgo}`);
            Logger.plain(c.body);
          }
        }
      } catch (error) {
        Logger.error('Error adding comment', error);
      }
    });
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
