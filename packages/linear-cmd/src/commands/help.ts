import { Logger } from '../lib/logger.js';

export function displayHelp(): void {
  Logger.plain('');
  Logger.bold('Examples:');
  Logger.plain('  $ linear account add                     # Add a new account');
  Logger.plain('  $ linear account list                    # List all accounts');
  Logger.plain('  $ linear account test                    # Test all accounts');
  Logger.plain('  $ linear issue show WORK-123             # Show issue by ID');
  Logger.plain('  $ linear issue show <linear-url>         # Show issue by URL');
  Logger.plain('  $ linear issue list -a work              # List all issues grouped by status');
  Logger.plain('  $ linear issue list -a work --assignee me  # List my issues');
  Logger.plain('  $ linear issue list -a work --team TES   # Filter by team');
  Logger.plain('  $ linear issue create -a work            # Create new issue (interactive)');
  Logger.plain('  $ linear issue update WORK-123           # Update issue (interactive)');
  Logger.plain('  $ linear issue comment WORK-123          # Add comment (interactive)');
  Logger.plain('  $ linear project list -a work            # List all projects');
  Logger.plain('  $ linear project show <project-url>      # Show project details');
  Logger.plain('  $ linear project issues <project-url>    # List project issues');
  Logger.plain('  $ linear project create -a work          # Create new project');
  Logger.plain('  $ linear project delete <project-url>    # Delete a project');
  Logger.plain('  $ linear document show <document-url>    # Show document content');
  Logger.plain('  $ linear document add -a work            # Create new document');
  Logger.plain('  $ linear document delete <document-url>  # Delete a document');
  Logger.plain('  $ linear update                          # Update linear-cmd to latest version');
  Logger.plain('  $ linear completion install              # Install shell completion');
  Logger.plain('');
  Logger.bold('Getting Started:');
  Logger.plain('  1. Get your API key from Linear Settings > Account > API');
  Logger.plain('  2. Run: linear account add');
  Logger.plain('  3. Test connection: linear account test');
  Logger.plain('  4. List your issues: linear issue list -a <account-name> --assignee me');
  Logger.plain('');
  Logger.dim('For more information, visit: https://linear.app/developers');
}
