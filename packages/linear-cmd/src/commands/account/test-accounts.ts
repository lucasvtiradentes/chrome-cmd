import { LinearClient } from '@linear/sdk';
import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';
import { Logger } from '../../lib/logger.js';

export function createTestAccountsCommand(): Command {
  return new Command('test').description('Test all configured accounts').action(async () => {
    try {
      const configManager = new ConfigManager();
      const accounts = configManager.getAllAccounts();

      if (accounts.length === 0) {
        Logger.warning('No accounts configured. Use "linear account add" to add one.');
        return;
      }

      Logger.bold('Testing all accounts:\n');

      for (const account of accounts) {
        try {
          const client = new LinearClient({ apiKey: account.api_key });
          const viewer = await client.viewer;

          Logger.success(`${account.name}: ${viewer.name} (${viewer.email})`);
        } catch (error) {
          Logger.error(`${account.name}: ${error instanceof Error ? error.message : 'Connection failed'}`);
        }
      }
    } catch (error) {
      Logger.error('Error testing accounts', error);
    }
  });
}
