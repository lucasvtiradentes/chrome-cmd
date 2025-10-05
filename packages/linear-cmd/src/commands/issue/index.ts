import { Command } from 'commander';

import { createCommentIssueCommand } from './comment-issue.js';
import { createCreateIssueCommand } from './create-issue.js';
import { createListIssuesCommand } from './list-issues.js';
import { createShowIssueCommand } from './show-issue.js';
import { createUpdateIssueCommand } from './update-issue.js';

export function createIssueCommand(): Command {
  const issue = new Command('issue');
  issue.description('Manage Linear issues');

  issue.addCommand(createShowIssueCommand());
  issue.addCommand(createCreateIssueCommand());
  issue.addCommand(createListIssuesCommand());
  issue.addCommand(createUpdateIssueCommand());
  issue.addCommand(createCommentIssueCommand());

  return issue;
}
