import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema, type TabsClickOptions } from '../../../../shared/commands/command-builder.js';
import { CommandNames, getSubCommand, SubCommandNames } from '../../../../shared/commands/commands-schema.js';
import { APP_NAME } from '../../../../shared/constants/constants.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createClickTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_CLICK, async (options: TabsClickOptions) => {
    try {
      const schema = getSubCommand(CommandNames.TAB, SubCommandNames.TAB_CLICK);
      const selectorFlag = schema?.flags?.find((f) => f.name === '--selector');
      const textFlag = schema?.flags?.find((f) => f.name === '--text');
      const tabFlag = schema?.flags?.find((f) => f.name === '--tab');

      if (!options.selector && !options.text) {
        console.error(chalk.red('Error: Either --selector or --text is required'));
        console.log(
          chalk.yellow(
            `Usage: ${APP_NAME} tabs click ${selectorFlag?.name} "<css-selector>" [${tabFlag?.name} <tabIndex>]`
          )
        );
        console.log(
          chalk.yellow(`   or: ${APP_NAME} tabs click ${textFlag?.name} "<text-content>" [${tabFlag?.name} <tabIndex>]`)
        );
        process.exit(1);
      }

      if (options.selector && options.text) {
        console.error(chalk.red('Error: Cannot use both --selector and --text at the same time'));
        process.exit(1);
      }

      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());

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
}
