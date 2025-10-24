import { Command } from 'commander';
import { logger } from '../../../shared/utils/helpers/logger.js';
import { PathHelper } from '../../../shared/utils/helpers/path.helper.js';
import { detectShell } from '../../../shared/utils/helpers/shell-utils.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';
import { uninstallBashCompletion, uninstallZshCompletion } from './utils.js';

export function createCompletionUninstallCommand(): Command {
  return createSubCommandFromSchema(CommandNames.COMPLETION, SubCommandNames.COMPLETION_UNINSTALL, async () => {
    if (PathHelper.isWindows()) {
      logger.newline();
      logger.warning('⚠️  Shell completion is not supported on Windows');
      logger.newline();
      process.exit(1);
    }

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
