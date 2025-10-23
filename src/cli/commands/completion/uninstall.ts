import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../shared/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../shared/commands/utils.js';
import { logger } from '../../../shared/utils/helpers/logger.js';
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
          logger.error(`❌ Unsupported shell: ${shell}`);
          logger.newline();
          logger.info('🐚 Supported shells: zsh, bash');
          process.exit(1);
      }
    } catch (error) {
      logger.error(`Failed to uninstall completion: ${error}`);
      process.exit(1);
    }
  });
}
