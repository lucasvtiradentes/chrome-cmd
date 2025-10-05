import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';
import { Logger } from '../../lib/logger.js';

export function createListAccountsCommand(): Command {
  return new Command('list').description('List all configured accounts').action(async () => {
    const configManager = new ConfigManager();
    const accounts = configManager.getAllAccounts();

    if (accounts.length === 0) {
      Logger.warning('No accounts configured. Use "linear account add" to add one.');
      return;
    }

    Logger.bold('\nConfigured accounts:');
    accounts.forEach((account) => {
      const workspaces = account.workspaces?.length ? `[${account.workspaces.join(', ')}]` : '';
      if (workspaces) {
        Logger.plain(`  • ${account.name}`);
        Logger.dim(`    ${workspaces}`);
      } else {
        Logger.plain(`  • ${account.name}`);
      }
    });
  });
}
