#!/usr/bin/env node

import { Command } from 'commander';

import { createAccountCommand } from './commands/account/index.js';
import { createCompletionCommand } from './commands/completion.js';
import { createDocumentCommand } from './commands/document/index.js';
import { displayHelp } from './commands/help.js';
import { createIssueCommand } from './commands/issue/index.js';
import { createProjectCommand } from './commands/project/index.js';
import { createUpdateCommand } from './commands/update.js';
import { APP_INFO } from './constants.js';

const program = new Command();

program.name('linear').description('Linear CLI - A GitHub CLI-like tool for Linear').version(APP_INFO.version);

// Add commands
program.addCommand(createAccountCommand());
program.addCommand(createIssueCommand());
program.addCommand(createProjectCommand());
program.addCommand(createDocumentCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createCompletionCommand());

// Global help improvements
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name()
});

// Show detailed help on --help
program.on('--help', () => {
  displayHelp();
});

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
