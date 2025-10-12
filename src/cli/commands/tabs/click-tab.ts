import chalk from 'chalk';
import { Command } from 'commander';
import { APP_NAME } from '../../../shared/constants.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createClickTabCommand(): Command {
  const clickTab = new Command('click');
  clickTab
    .description('Click on an element in a specific tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .option('--selector <selector>', 'CSS selector of the element to click')
    .option('--text <text>', 'Find element by text content (alternative to --selector)')
    .action(async (options: { tab?: string; selector?: string; text?: string }) => {
      try {
        if (!options.selector && !options.text) {
          console.error(chalk.red('Error: Either --selector or --text is required'));
          console.log(chalk.yellow(`Usage: ${APP_NAME} tabs click --selector "<css-selector>" [--tab <indexOrId>]`));
          console.log(chalk.yellow(`   or: ${APP_NAME} tabs click --text "<text-content>" [--tab <indexOrId>]`));
          process.exit(1);
        }

        if (options.selector && options.text) {
          console.error(chalk.red('Error: Cannot use both --selector and --text at the same time'));
          process.exit(1);
        }

        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);

        if (options.text) {
          await client.clickElementByText(tabId, options.text);
          console.log(chalk.green('✓ Element clicked successfully'));
          console.log(chalk.gray(`  Text: ${options.text}`));
        } else if (options.selector) {
          await client.clickElement(tabId, options.selector);
          console.log(chalk.green('✓ Element clicked successfully'));
          console.log(chalk.gray(`  Selector: ${options.selector}`));
        }
      } catch (error) {
        console.error(chalk.red('Error clicking element:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return clickTab;
}
