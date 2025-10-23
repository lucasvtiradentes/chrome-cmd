#!/usr/bin/env node

import { Command } from 'commander';
import { APP_INFO } from '../shared/constants/constants-node.js';
import { createCompletionCommand } from './commands/completion/index.js';
import { displayHelp } from './commands/help.js';
import { createInstallCommand } from './commands/install.js';
import { createProfileCommand } from './commands/profile/index.js';
import { createTabCommand } from './commands/tab/index.js';
import { createUpdateCommand } from './commands/update.js';

const program = new Command();

program.name(APP_INFO.name).description(APP_INFO.description).version(APP_INFO.version);

program.addCommand(createTabCommand());
program.addCommand(createProfileCommand());
program.addCommand(createInstallCommand());
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
