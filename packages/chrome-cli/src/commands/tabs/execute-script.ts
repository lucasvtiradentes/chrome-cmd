import { Command } from 'commander';
import chalk from 'chalk';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createExecuteScriptCommand(): Command {
  const executeScript = new Command('exec');
  executeScript
    .description('Execute JavaScript in a specific tab')
    .argument('<tabId>', 'Tab ID to execute script in')
    .argument('<code>', 'JavaScript code to execute')
    .action(async (tabId: string, code: string) => {
      try {
        const client = new ChromeClient();
        const result = await client.executeScript(parseInt(tabId), code);

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
