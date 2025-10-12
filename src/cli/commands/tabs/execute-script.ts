import chalk from 'chalk';
import { Command } from 'commander';
import { APP_NAME } from '../../../shared/constants.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createExecuteScriptCommand(): Command {
  const executeScript = new Command('exec');
  executeScript
    .description('Execute JavaScript in a specific tab')
    .argument('[code]', 'JavaScript code to execute')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .action(async (code: string | undefined, options: { tab?: string }) => {
      try {
        if (!code) {
          console.error(chalk.red('Error: JavaScript code is required'));
          console.log(chalk.yellow(`Usage: ${APP_NAME} tabs exec "<code>" [--tab <indexOrId>]`));
          process.exit(1);
        }

        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);
        const result = await client.executeScript(tabId, code);

        console.log(chalk.green('✓ Script executed successfully'));
        console.log(chalk.bold('\nResult:'));
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(chalk.red('Error executing script:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return executeScript;
}
