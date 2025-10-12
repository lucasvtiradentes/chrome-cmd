import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createInputTabCommand(): Command {
  const inputTab = new Command('input');
  inputTab
    .description('Fill an input field in a specific tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .option('--selector <selector>', 'CSS selector of the input element (required)')
    .option('--value <value>', 'Value to fill in the input field (required)')
    .option('--submit', 'Press Enter after filling the input field')
    .action(async (options: { tab?: string; selector?: string; value?: string; submit?: boolean }) => {
      try {
        if (!options.selector) {
          console.error(chalk.red('Error: --selector is required'));
          console.log(
            chalk.yellow(
              'Usage: chrome-cmd tabs input --selector "<css-selector>" --value "<value>" [--tab <indexOrId>]'
            )
          );
          process.exit(1);
        }

        if (!options.value) {
          console.error(chalk.red('Error: --value is required'));
          console.log(
            chalk.yellow(
              'Usage: chrome-cmd tabs input --selector "<css-selector>" --value "<value>" [--tab <indexOrId>]'
            )
          );
          process.exit(1);
        }

        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);

        await client.fillInput(tabId, options.selector, options.value, options.submit || false);

        console.log(chalk.green('✓ Input field filled successfully'));
        console.log(chalk.gray(`  Selector: ${options.selector}`));
        console.log(chalk.gray(`  Value: ${options.value}`));
        if (options.submit) {
          console.log(chalk.gray(`  Submit: Enter key pressed`));
        }
      } catch (error) {
        console.error(chalk.red('Error filling input:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return inputTab;
}
