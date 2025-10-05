import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigManager } from '../../lib/config-manager.js';
import { Logger } from '../../lib/logger.js';

export function createRemoveAccountCommand(): Command {
  return new Command('remove')
    .arguments('<name>')
    .description('Remove an account')
    .action(async (name: string) => {
      const configManager = new ConfigManager();

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to remove account "${name}"?`,
          default: false
        }
      ]);

      if (!confirm) {
        Logger.warning('Aborted.');
        return;
      }

      try {
        await configManager.removeAccount(name);
        Logger.success(`Account "${name}" removed successfully!`);
      } catch (error) {
        Logger.error('Error removing account', error);
      }
    });
}
