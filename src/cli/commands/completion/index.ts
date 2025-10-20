import { Command } from 'commander';
import { createCommandFromSchema } from '../../../shared/commands/command-builder.js';
import { CommandNames } from '../../../shared/commands/commands-definitions.js';
import { createCompletionInstallCommand } from './install.js';
import { createCompletionUninstallCommand } from './uninstall.js';

export function createCompletionCommand(): Command {
  const completion = createCommandFromSchema(CommandNames.COMPLETION);

  completion.addCommand(createCompletionInstallCommand());
  completion.addCommand(createCompletionUninstallCommand());

  return completion;
}

export { reinstallCompletionSilently, uninstallCompletionSilently } from './utils.js';
