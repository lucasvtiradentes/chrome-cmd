import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../protocol/commands/utils.js';
import { logger } from '../../../shared/utils/helpers/logger.js';
import { detectShell } from '../../../shared/utils/helpers/shell-utils.js';
import { installBashCompletion, installZshCompletion } from './utils.js';

export function createCompletionInstallCommand(): Command {
  return createSubCommandFromSchema(CommandNames.COMPLETION, SubCommandNames.COMPLETION_INSTALL, async () => {
    const shell = detectShell();

    if (!shell) {
      logger.error('❌ Could not detect shell');
      logger.newline();
      logger.info('🐚 Supported shells: bash, zsh');
      logger.info('💡 Set SHELL environment variable or run from bash/zsh');
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
      logger.error(`Failed to install completion: ${error}`);
      process.exit(1);
    }
  });
}
