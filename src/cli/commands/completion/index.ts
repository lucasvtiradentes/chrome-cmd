import { Command } from 'commander';
import { CommandNames } from '../../../shared/commands/definitions.js';
import { createCommandFromSchema } from '../../../shared/commands/utils.js';
import { createCompletionInstallCommand } from './install.js';
import { createCompletionUninstallCommand } from './uninstall.js';

export function createCompletionCommand(): Command {
  const completion = createCommandFromSchema(CommandNames.COMPLETION);

  completion.addCommand(createCompletionInstallCommand());
  completion.addCommand(createCompletionUninstallCommand());

  return completion;
}

export { reinstallCompletionSilently, uninstallCompletionSilently } from './utils.js';
