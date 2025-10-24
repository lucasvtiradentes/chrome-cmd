import { Command } from 'commander';
import { CommandNames } from '../../schemas/definitions.js';
import { createCommandFromSchema } from '../../schemas/utils.js';
import { createCompletionInstallCommand } from './install.js';
import { createCompletionUninstallCommand } from './uninstall.js';

export function createCompletionCommand(): Command {
  const completion = createCommandFromSchema(CommandNames.COMPLETION);

  completion.addCommand(createCompletionInstallCommand());
  completion.addCommand(createCompletionUninstallCommand());

  return completion;
}
