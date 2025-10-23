import { Command } from 'commander';
import type { TabsExecOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema, getSubCommand } from '../../../../shared/commands/utils.js';
import { APP_NAME } from '../../../../shared/constants/constants.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createExecuteScriptCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_EXEC,
    async (code: string | undefined, options: TabsExecOptions) => {
      const commandPromise = async () => {
        const schema = getSubCommand(CommandNames.TAB, SubCommandNames.TAB_EXEC);
        const codeArg = schema?.flags?.find((f) => f.name === 'code');
        const tabFlag = schema?.flags?.find((f) => f.name === '--tab');

        if (!code) {
          logger.error(`Error: ${codeArg?.description || 'JavaScript code'} is required`);
          logger.warning(`Usage: ${APP_NAME} tabs exec "<code>" [${tabFlag?.name} <tabIndex>]`);
          process.exit(1);
        }

        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        const result = await client.executeScript(tabId, code);

        logger.success('✓ Script executed successfully');
        logger.bold('\nResult:');
        logger.info(JSON.stringify(result, null, 2));
      };

      await commandPromise().catch(commandErrorHandler('Error executing script:'));
    }
  );
}
