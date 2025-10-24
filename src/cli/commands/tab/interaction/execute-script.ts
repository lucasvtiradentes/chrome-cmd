import { Command } from 'commander';
import { CLI_NAME } from '../../../../shared/constants/constants.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import type { TabsExecOptions } from '../../../schemas/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../schemas/definitions.js';
import { createSubCommandFromSchema, getSubCommand } from '../../../schemas/utils.js';
import { logErrorAndExit } from '../../../utils/log-error-and-exit.js';

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
          logErrorAndExit(
            `${codeArg?.description || 'JavaScript code'} is required\n\nUsage: ${CLI_NAME} tabs exec "<code>" [${tabFlag?.name} --tab <index>]`
          );
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
