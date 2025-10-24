import { Command } from 'commander';
import { colors } from '../../../../shared/utils/helpers/colors.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import type { TabsFocusOptions } from '../../../schemas/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../../schemas/utils.js';
import { logErrorAndExit } from '../../../utils/log-error-and-exit.js';

export function createFocusTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_FOCUS, async (options: TabsFocusOptions) => {
    const commandPromise = async () => {
      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());

      const tabs = await client.listTabs();
      const tab = tabs.find((t) => t.tabId === tabId);

      if (!tab) {
        logErrorAndExit(`Tab with ID ${tabId} not found`);
      }

      await client.activateTab(tabId);

      logger.success('✓ Tab focused successfully');
      logger.info('');
      logger.bold('Focused tab:');
      logger.info(`  ${colors.cyan('ID:')} ${tabId}`);
      logger.info(`  ${colors.cyan('Title:')} ${tab.title || 'Untitled'}`);
      logger.info(`  ${colors.cyan('URL:')} ${tab.url || 'N/A'}`);
    };

    await commandPromise().catch(commandErrorHandler('Error focusing tab:'));
  });
}
