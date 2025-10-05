import { LinearClient } from '@linear/sdk';
import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigManager } from '../../lib/config-manager.js';
import { Logger } from '../../lib/logger.js';

export function createAddAccountCommand(): Command {
  return new Command('add').description('Add a new Linear account').action(async () => {
    const configManager = new ConfigManager();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Account name (e.g., "personal", "work"):',
        validate: (input) => input.length > 0 || 'Account name is required'
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'Linear API key:',
        validate: (input) => input.length > 0 || 'API key is required'
      }
    ]);

    try {
      // Test the API key before saving
      Logger.loading('Testing API key...');
      const testClient = new LinearClient({ apiKey: answers.apiKey });
      const viewer = await testClient.viewer;

      await configManager.addAccount(answers.name, answers.apiKey);

      Logger.success(`Account "${answers.name}" added successfully!`);
      Logger.dim(`Connected as: ${viewer.name} (${viewer.email})`);
    } catch (error) {
      Logger.error('Error adding account', error);
      Logger.dim('Please check your API key and try again.');
    }
  });
}
