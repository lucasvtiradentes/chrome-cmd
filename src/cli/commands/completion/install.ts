import chalk from 'chalk';
import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../shared/commands/cli-command.js';
import { createSubCommandFromSchema } from '../../../shared/utils/helpers/command-builder.js';
import { detectShell, installBashCompletion, installZshCompletion } from './utils.js';

export function createCompletionInstallCommand(): Command {
  return createSubCommandFromSchema(CommandNames.COMPLETION, SubCommandNames.COMPLETION_INSTALL, async () => {
    const shell = detectShell();

    if (!shell) {
      console.error(chalk.red('❌ Could not detect shell'));
      console.log('');
      console.log('🐚 Supported shells: bash, zsh');
      console.log('💡 Set SHELL environment variable or run from bash/zsh');
      process.exit(1);
    }

    try {
      switch (shell) {
        case 'zsh':
          await installZshCompletion();
          break;
        case 'bash':
          await installBashCompletion();
          break;
      }
    } catch (error) {
      console.error(chalk.red(`Failed to install completion: ${error}`));
      process.exit(1);
    }
  });
}
