import chalk from 'chalk';
import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/cli-command.js';
import { getSubCommand } from '../../../../shared/commands/commands.js';
import type { TabsInputOptions } from '../../../../shared/commands/commands-schemas.js';
import { APP_NAME } from '../../../../shared/constants/constants.js';
import { createSubCommandFromSchema } from '../../../../shared/utils/command-builder.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createInputTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_INPUT, async (options: TabsInputOptions) => {
    try {
      const schema = getSubCommand(CommandNames.TAB, SubCommandNames.TAB_INPUT);
      const selectorFlag = schema?.flags?.find((f) => f.name === '--selector');
      const valueFlag = schema?.flags?.find((f) => f.name === '--value');
      const tabFlag = schema?.flags?.find((f) => f.name === '--tab');

      if (!options.selector) {
        console.error(chalk.red(`Error: ${selectorFlag?.name} is required`));
        console.log(
          chalk.yellow(
            `Usage: ${APP_NAME} tabs input ${selectorFlag?.name} "<css-selector>" ${valueFlag?.name} "<value>" [${tabFlag?.name} <tabIndex>]`
          )
        );
        process.exit(1);
      }

      if (!options.value) {
        console.error(chalk.red(`Error: ${valueFlag?.name} is required`));
        console.log(
          chalk.yellow(
            `Usage: ${APP_NAME} tabs input ${selectorFlag?.name} "<css-selector>" ${valueFlag?.name} "<value>" [${tabFlag?.name} <tabIndex>]`
          )
        );
        process.exit(1);
      }

      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());

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
}
