import { Command } from 'commander';
import type { TabsFocusOptions } from '../../../../protocol/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../protocol/commands/utils.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
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
      logger.info(`  ${logger.cyan('ID:')} ${tabId}`);
      logger.info(`  ${logger.cyan('Title:')} ${tab.title || 'Untitled'}`);
      logger.info(`  ${logger.cyan('URL:')} ${tab.url || 'N/A'}`);
    };

    await commandPromise().catch(commandErrorHandler('Error focusing tab:'));
  });
}
