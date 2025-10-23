import { Command } from 'commander';
import type { TabsFocusOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../shared/commands/utils.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createFocusTabCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TAB, SubCommandNames.TAB_FOCUS, async (options: TabsFocusOptions) => {
    const commandPromise = async () => {
      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());

      const tabs = await client.listTabs();
      const tab = tabs.find((t) => t.tabId === tabId);

      if (!tab) {
        logger.error(`Error: Tab with ID ${tabId} not found`);
        process.exit(1);
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
