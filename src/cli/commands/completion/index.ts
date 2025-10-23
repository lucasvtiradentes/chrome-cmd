import { Command } from 'commander';
import { CommandNames } from '../../../shared/commands/cli-command.js';
import { createCommandFromSchema } from '../../../shared/utils/helpers/command-builder.js';
import { createCompletionInstallCommand } from './install.js';
import { createCompletionUninstallCommand } from './uninstall.js';

export function createCompletionCommand(): Command {
  const completion = createCommandFromSchema(CommandNames.COMPLETION);

  completion.addCommand(createCompletionInstallCommand());
  completion.addCommand(createCompletionUninstallCommand());

  return completion;
}

export { reinstallCompletionSilently, uninstallCompletionSilently } from './utils.js';
