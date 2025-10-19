#!/usr/bin/env node

import { Command } from 'commander';
import { APP_INFO } from '../shared/constants-node.js';
import { createCompletionCommand } from './commands/completion.js';
import { displayHelp } from './commands/help.js';
import { createProfileCommand } from './commands/profile/index.js';
import { createTabsCommand } from './commands/tabs/index.js';
import { createUpdateCommand } from './commands/update.js';

const program = new Command();

program.name(APP_INFO.name).description('Chrome CMD - Control Chrome from the command line').version(APP_INFO.version);

program.addCommand(createTabsCommand());
program.addCommand(createProfileCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createCompletionCommand());

program.configureHelp({
  sortSubcommands: false,
  subcommandTerm: (cmd) => cmd.name()
});

program.on('--help', () => {
  displayHelp();
});

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
