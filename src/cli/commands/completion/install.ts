import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema } from '../../../shared/commands/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands/commands-definitions.js';
import { detectShell, installBashCompletion, installZshCompletion } from './utils.js';

export function createCompletionInstallCommand(): Command {
  return createSubCommandFromSchema(CommandNames.COMPLETION, SubCommandNames.COMPLETION_INSTALL, async () => {
    const shell = detectShell();

    try {
      switch (shell) {
        case 'zsh':
          await installZshCompletion();
          break;
        case 'bash':
          await installBashCompletion();
          break;
        default:
          console.error(chalk.red(`❌ Unsupported shell: ${shell}`));
          console.log('');
          console.log('🐚 Supported shells: zsh, bash');
          console.log('💡 Please switch to a supported shell to use autocompletion');
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Failed to install completion: ${error}`));
      process.exit(1);
    }
  });
}
