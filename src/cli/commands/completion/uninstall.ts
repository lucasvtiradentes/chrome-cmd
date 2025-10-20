import chalk from 'chalk';
import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../shared/commands/cli-command.js';
import { createSubCommandFromSchema } from '../../../shared/utils/command-builder.js';
import { detectShell, uninstallBashCompletion, uninstallZshCompletion } from './utils.js';

export function createCompletionUninstallCommand(): Command {
  return createSubCommandFromSchema(CommandNames.COMPLETION, SubCommandNames.COMPLETION_UNINSTALL, async () => {
    const shell = detectShell();

    try {
      switch (shell) {
        case 'zsh':
          await uninstallZshCompletion();
          break;
        case 'bash':
          await uninstallBashCompletion();
          break;
        default:
          console.error(chalk.red(`❌ Unsupported shell: ${shell}`));
          console.log('');
          console.log('🐚 Supported shells: zsh, bash');
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Failed to uninstall completion: ${error}`));
      process.exit(1);
    }
  });
}
