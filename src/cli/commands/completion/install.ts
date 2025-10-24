import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../protocol/commands/utils.js';
import { logger } from '../../../shared/utils/helpers/logger.js';
import { PathHelper } from '../../../shared/utils/helpers/path.helper.js';
import { detectShell } from '../../../shared/utils/helpers/shell-utils.js';
import { installBashCompletion, installZshCompletion } from './utils.js';

export function createCompletionInstallCommand(): Command {
  return createSubCommandFromSchema(CommandNames.COMPLETION, SubCommandNames.COMPLETION_INSTALL, async () => {
    if (PathHelper.isWindows()) {
      logger.newline();
      logger.warning('⚠️  Shell completion is not supported on Windows');
      logger.newline();
      logger.info('💡 Completion is only available on Linux and macOS with bash/zsh');
      logger.newline();
      process.exit(1);
    }

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
        default:
          logger.error(`❌ Unsupported shell: ${shell}`);
          logger.newline();
          logger.info('🐚 Supported shells: bash, zsh');
          process.exit(1);
      }
    } catch (error) {
      logger.error(`Failed to install completion: ${error}`);
      process.exit(1);
    }
  });
}
