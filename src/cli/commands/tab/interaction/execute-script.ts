import chalk from 'chalk';
import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/cli-command.js';
import { getSubCommand } from '../../../../shared/commands/commands.js';
import type { TabsExecOptions } from '../../../../shared/commands/commands-schemas.js';
import { APP_NAME } from '../../../../shared/constants/constants.js';
import { createSubCommandFromSchema } from '../../../../shared/utils/helpers/command-builder.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createExecuteScriptCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_EXEC,
    async (code: string | undefined, options: TabsExecOptions) => {
      try {
        const schema = getSubCommand(CommandNames.TAB, SubCommandNames.TAB_EXEC);
        const codeArg = schema?.flags?.find((f) => f.name === 'code');
        const tabFlag = schema?.flags?.find((f) => f.name === '--tab');

        if (!code) {
          console.error(chalk.red(`Error: ${codeArg?.description || 'JavaScript code'} is required`));
          console.log(chalk.yellow(`Usage: ${APP_NAME} tabs exec "<code>" [${tabFlag?.name} <tabIndex>]`));
          process.exit(1);
        }

        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        const result = await client.executeScript(tabId, code);

        console.log(chalk.green('✓ Script executed successfully'));
        console.log(chalk.bold('\nResult:'));
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(chalk.red('Error executing script:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}
