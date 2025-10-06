#!/usr/bin/env node

import { Command } from 'commander';
import { createCompletionCommand } from './commands/completion.js';
import { displayHelp } from './commands/help.js';
import { createHostCommand } from './commands/host.js';
import { createTabsCommand } from './commands/tabs/index.js';
import { createUpdateCommand } from './commands/update.js';
import { APP_INFO } from './constants.js';

const program = new Command();

program.name('chrome-cmd').description('Chrome CMD - Control Chrome from the command line').version(APP_INFO.version);

// Add commands
program.addCommand(createTabsCommand());
program.addCommand(createHostCommand());
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
